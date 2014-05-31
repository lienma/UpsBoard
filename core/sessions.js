
var bcrypt			= require('bcryptjs')
  , fs				= require('fs')
  , LocalStrategy	= require('passport-local').Strategy
  , passport		= require('passport')
  , session			= require('express-session')
  , SQLiteStore		= require('connect-sqlite3')(session);

var paths			= require('./paths')
  , log				= require(paths.logger)('SESSIONS');

function Sessions(app) {
	if(!(this instanceof Sessions)) {
		return new Sessions(app);
	}

	var file = app.dir + '/upsboard.db';
	var exists = fs.existsSync(file);


	if(!exists) {
		log.debug('Creating DB file.');
		fs.openSync(file, 'w');
	}

	this.store = new SQLiteStore({
		dir: app.dir,
		db: 'upsboard'
	});

	this.create = function() {
		return session({
			store: this.store,
			key: 'ups.board.key',
			secret: app.config.salt,
			cookie: { httpOnly: false },
			proxy: true
		});
	};

	this.get = this.store.get.bind(this.store);

	passport.use(new LocalStrategy(function(username, password, done) {
		if(username == app.config.user.username) {
			bcrypt.compare(password, app.config.user.password, function(err, res) {

				if(res) {
					done(null, app.config.user);
				} else {
					done(null, false, { message: 'Incorrect username or password.' });
				}
			});
		} else {
			done(null, false, { message: 'Incorrect username or password.' });
		}
	}));

	passport.serializeUser(function(username, done) {
		done(null, 1);
	});

	passport.deserializeUser(function(userId, done) {
		done(null, app.config.user);
	});


	this.passportInitialize = function() {
		return passport.initialize();
	};

	this.passportSession = function() {
		return passport.session();
	};
}

module.exports = Sessions;
