var _				= require('underscore')
  , cookieParser	= require('cookie-parser')
  , passport		= require('passport');

var paths			= require('./paths')
  , log				= require(paths.logger)('SOCKET.IO');

function parseCookie(app, cookieHeader) {
	var cp = cookieParser(app.config.salt);
	var req = {
		headers:{
			cookie: cookieHeader
		}
	};

	var result;
	cp(req, {}, function (err) {
		if (err) throw err;
		result = req.signedCookies;
	});
	return result;
}

function IOClass(server, app) {
	if(!(this instanceof IOClass)) {
		return new IOClass(server, app);
	}

	var io		= require('socket.io')(server);
	io.users	= [];
	var jobs	= new Jobs(io);

	io.use(function(socket, next) {
		var handshakeData = socket.request;
		var headers = handshakeData.headers;
		var cookies = parseCookie(app, headers.cookie);
		var sessionID = (handshakeData.query && handshakeData.query.session_id) || cookies[app.key] || '';

		app.sessions.get(sessionID, function(err, session) {
			socket.user = {};
			if(err || !session || !session[passport._key] || !session[passport._key].user) {
				socket.user.loggedIn = false;
			} else {
				passport.deserializeUser(session[passport._key].user, function(err, user) {
    				if(err || !user) {
						socket.user.loggedIn = false;
					} else {
						socket.user = user;
						socket.user.loggedIn = true;
					}
				});
			}

			next();
		});

	});

	io.on('connection', function(socket) {
		io.users.push(socket);

		log.debug('A client has connected. Total connected: ' + io.users.length);

		socket.on('disconnect', function() {
			io.users = _.reject(io.users, function(s) { return s.id == socket.id; });

			log.debug('Client has disconnected. Total connected: ' + io.users.length);

			if(io.users.length == 0) {
				jobs.stop();
			}
		});

		if(io.users.length == 1) {
			jobs.start();
		}
	});

	io.register = function(opts) {
		jobs.add(opts);
	};

	return io;
}

function Jobs(io) {
	this.io = io;

	this.jobs = [];
};

Jobs.prototype.add = function(opts) {
	opts.io = this.io;
	this.jobs.push(new Job(opts));
};

Jobs.prototype.start = function() {
	log.debug('Starting up all the jobs.');
	this.jobs.forEach(function(job) {
		job.start();
	});
};

Jobs.prototype.stop = function() {
	this.jobs.forEach(function(job) {
		job.stop();
	});
};

function Job(opts) {
	this.get = opts.get;
	this.name = opts.name;
	this.once = opts.once ? true : false;
	this.timeout = opts.timeout ? opts.timeout : false;
	this.send = opts.send;

	this.io = opts.io;

	this._timeout = false;
}

Job.prototype.start = function() {
	log.debug('Starting Job:', this.name.cyan);

	var self = this;

	if(!this.once && this.timeout) {
		this._timeout = setTimeout(function() {
			self.start();
		}, this.timeout);
	}

	this.get().then(function(results) {
		self.io.users.forEach(function(socket) {
			self.send(results, socket).then(function(data) {
				socket.emit(self.name, data);
			});
		});
	});
};

Job.prototype.stop = function() {
	log.debug('Stopping Job:', this.name.cyan);
	clearTimeout(this._timeout);
};

module.exports = IOClass;
