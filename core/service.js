var Connection 	= require('ssh2')
  , when 		= require('when')
  , path 		= require('path');

var appRoot 	= path.resolve(__dirname, '../')
  , paths 		= require(appRoot + '/core/paths');

var log 		= require(paths.logger)('SERVICE');

var counter = 0;
function Service(host, port, options) {
	var self = this;

	counter += 1;
	this._id = counter;

	var options = (options) ? options : {};

	this.label = (options.label) ? options.label : '';
	this.host = host;
	this.port = port;
	this.url = (options && options.url) ? options.url : false;
	this.loginRequired = (options && options.loginRequired) ? options.loginRequired : false;


	if(options.username) {
		var username = options.username;
		var password = (options.password) ? options.password : '';

		this.connect = function() {
			var promise = when.defer();
			log.debug('Testing to see if server,', self.toString().yellow, 'is online');
			self.isOnline().then(function(isOnline) {
				if(isOnline) {
					var connection = new Connection();

					var sock = new require('net').Socket();
					sock.setTimeout(10000, function() {
						var erro = new Error('CONNECTION_TIMEOUT');
						erro.reason = 'Connection to ' + self.toString().yellow + ' has timed out!';
						promise.reject(erro);

						sock.destroy();
					});
					sock.setNoDelay(true);
					sock.setMaxListeners(0);
					sock.connect(self.port, self.host);

					connection.connect({ username: username, password: password, sock: sock});

					connection.on('error', function(err) {
						var error = false;
						if(err.level == 'authentication') {
							var erro = new Error('AUTHENTICATION_FAILED');
							erro.reason = 'Authentication to ' + self.toString().yellow + ' failed!';
						}

						if(err.code == 'ECONNREFUSED') {
							var erro = new Error('CONNECTION_FAILED');
							erro.reason = 'Connection to ' + self.toString().yellow + ' failed!';
						}

						if(erro) {
							return promise.reject(erro);
						}

						promise.reject(err);
					});

					connection.on('ready', function() {
						log.debug('Connection made to server', self.toString().yellow);
						promise.resolve(connection);
					});
				} else {
					var err = new Error('SERVER_OFFLINE');
					err.reason = 'Could not reach ' + self.toString();
					log.error('Failed to connection to server', self.toString().yellow);
					promise.reject(err);
				}
			}).otherwise(promise.reject);
			return promise.promise;
		}
	}
}

Service.prototype.getHost = function() {
	return this.host;
};

Service.prototype.getPort = function() {
	return this.port;
};

Service.prototype.getID = function() {
	return this._id;
};

Service.prototype.getLabel = function() {
	return this.label;
};

Service.prototype.getURL = function() {
	return this.url;
};

Service.prototype.toString = function() {
	return this.host + ':' + this.port;
};

Service.prototype.isOnline = function(returnSocket) {
	var promise = when.defer()
	  , self = this, isOnline = false
	  , Socket = new require('net').Socket();

	Socket.setTimeout(5000);
	Socket.connect(this.port, this.host);

	Socket.on('connect', function() {
		isOnline = true;
		promise.resolve(true);
		Socket.destroy();
	});

	Socket.on('error', failed);
	Socket.on('timeout', failed);

	return promise.promise;

	function failed() {
		if(!isOnline) {
			promise.resolve(false);
		}
		Socket.destroy()
	}
}

exports = module.exports = Service;
