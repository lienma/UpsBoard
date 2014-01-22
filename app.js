/**
 * Module dependencies.
 */

var express 		= require('express')
  , stylus 			= require('stylus')
  , nib 			= require('nib')
  , http 			= require('http')
  , path 			= require('path')
  , os 				= require('os')
  , bcrypt 			= require('bcrypt')
  , expressUglify 	= require('express-uglify');

var passport 		= require('passport')
  , LocalStrategy 	= require('passport-local').Strategy;

var api 			= require('./routes/api')
  , routes 			= require('./routes')
  , stats 			= require('./routes/stats')
  , config 			= require('./libs/Config')
  , Logger 			= require('./libs/Logger');

var publicPath 		= path.join(__dirname, 'public')
  , app 			= express();

var server 			= http.createServer(app)
  , logger 			= Logger('MAIN_APP');

if(os.type() == 'Windows_NT') {
	console.log('UpsBoard only works on Linux operating system, and also Mac with limited features.');
	process.exit(0);
}

logger.info('Starting up app in', (process.env.NODE_ENV) ? process.env.NODE_ENV : 'unknown', 'environment.');
config().then(function(conf) {

	app.isMacOs = (os.type() == 'Linux') ? false : true;

	app.config = conf;

	// all environments
	app.set('host', app.config.host);
	app.set('port', app.config.port);
	app.set('views', path.join(__dirname, 'views'));
	app.set('view engine', 'jade');

	passport.use(new LocalStrategy(function(username, password, done) {
		if(username == conf.user.username) {

			bcrypt.compare(password, conf.user.password, function(err, res) {
				if(res) {
					done(null, conf.user);
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
		done(null, conf.user);
	});

	//app.use(app.config.webRoot, express.favicon());
	app.use(express.urlencoded());
	app.use(express.json());
	app.use(express.methodOverride());

	app.use(express.cookieParser());
	app.use(express.cookieSession({
		secret: conf.salt,
		cookie: { maxAge: 60 * 60 * 1000 }
	}));

	app.use(express.csrf());

	app.use(app.config.webRoot, stylus.middleware({src: publicPath, compile: function(str, path) {
		return stylus(str).set('filename', path) .use(nib())
	}}));

	app.configure(function() {

		if(conf.runningMode == 'normal') {
			app.enable('trust proxy');

			if(app.config.logHttpRequests) {
				app.use(express.logger());
			}

			function blankLog() {
				this.log = function() {
	
				};
			}

			app.use(app.config.webRoot, expressUglify.middleware({ src: publicPath, logger: new blankLog() }));
	
			var oneYear = 31557600000;
			app.use(app.config.webRoot, express.static(publicPath, { maxAge: oneYear }));
			app.use(express.errorHandler());
		} else {
			app.locals.pretty = true;
			app.use(express.responseTime());

			if(app.config.logHttpRequests) {
				app.use(express.logger('dev'));
			}

			app.use(app.config.webRoot, express.static(publicPath));
			app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
		}
	});

	app.use(passport.initialize());
	app.use(passport.session());

	app.use(app.router);
}).then(function() {

	var webRoot = app.config.webRoot;

	app.get(webRoot + '/', routes.index);
	app.post(webRoot + '/', routes.login);

	app.get(webRoot + '/install', routes.install);

	app.get(webRoot + '/api/plex/currentlyWatching', api.plex.currentlyWatching);
	app.get(webRoot + '/api/plex/poster', api.plex.poster);
	app.get(webRoot + '/api/plex/recentlyAddedMovies', api.plex.recentlyAddedMovies);
	app.get(webRoot + '/api/plex/recentlyAired', api.plex.recentlyAired);

	app.get(webRoot + '/api/sickbeard/poster', api.sickbeard.poster);
	app.get(webRoot + '/api/sickbeard/showsStats', api.sickbeard.showsStats);
	app.get(webRoot + '/api/sickbeard/upcoming', api.sickbeard.upcoming);

	app.get(webRoot + '/stats/all', stats.all);
	app.get(webRoot + '/stats/bandwidth', stats.bandwidth);
	app.get(webRoot + '/stats/cpu', stats.cpu);
	app.get(webRoot + '/stats/disks', stats.disks);
	app.get(webRoot + '/stats/memory', stats.memory);
	app.get(webRoot + '/stats/services', stats.services);
	app.get(webRoot + '/stats/weather', stats.weather);

}).then(function() {
	server.listen(app.get('port'), app.get('host'), function() {
		var uri = app.get('host') + ':' + app.get('port') + app.config.webRoot;

		logger.info('UpsBoard'.yellow, 'is running at',  uri.cyan);
	});
}).otherwise(function(reason) {

	if(reason instanceof Error) {
		if(reason.message == 'INVALID_CONFIG') {
			logger.fatal(reason.reason);

			if(reason.currently) {
				console.log('Currently is the configuration file:'.green);
				console.log(reason.currently);
			}
			if(reason.suggestion) {
				console.log('Suggestion:'.green);
				console.log(reason.suggestion);
			}
		} else {
			logger.error(reason.message);
			console.log(reason);
		}
	} else {
		logger.fatal(reason);
	}
});
