/**
 * Module dependencies.
 */

var express			= require('express')
  , stylus			= require('stylus')
  , nib				= require('nib')
  , http			= require('http')
  , path			= require('path')
  , os				= require('os')
  , when			= require('when')
  , bcrypt			= require('bcrypt')
  , expressUglify	= require('express-uglify');

var passport		= require('passport')
  , LocalStrategy	= require('passport-local').Strategy;

var appRoot			= path.resolve(__dirname)
  , paths			= require(appRoot + '/core/paths');

var routes			= require(paths.core + '/routes')
  , Configure		= require(paths.core + '/configure')
  , Updater			= require(paths.core + '/updater')
  , logger			= require(paths.logger)('MAIN_APP');

var app				= express();

if(process.env.NODE_ENV == 'development') {
	require('when/monitor/console');
}

if(os.type() == 'Windows_NT') {
	console.fatal('UpsBoard only works on Linux operating system, and also Mac with limited features.');
	process.exit(0);
}

logger.info('Starting up app in', (process.env.NODE_ENV) ? process.env.NODE_ENV : 'unknown', 'environment.');

Configure().then(function(conf) {


	app.isMacOs = (os.type() == 'Linux') ? false : true;

	app.config = conf;

	// all environments
	app.set('host', 		app.config.host);
	app.set('port', 		app.config.port);
	app.set('views', 		path.join(paths.core, 'views'));
	app.set('view engine', 	'jade');

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
		cookie: { maxAge: 24 * 60 * 60 * 1000 }
	}));

	app.use(express.csrf());

	app.use(app.config.webRoot, stylus.middleware({src: paths.public, compile: function(str, path) {
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

			app.use(app.config.webRoot, expressUglify.middleware({ src: paths.public, logger: new blankLog() }));
	
			var oneYear = 31557600000;
			app.use(app.config.webRoot, express.static(paths.public, { maxAge: oneYear }));
			app.use(express.errorHandler());
		} else {
			app.locals.pretty = true;
			app.use(express.responseTime());

			if(app.config.logHttpRequests) {
				app.use(express.logger('dev'));
			}

			app.use(app.config.webRoot, express.static(paths.public));
			app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
		}
	});

	app.use(passport.initialize());
	app.use(passport.session());

	app.use(app.router);
}).then(function() {

	var webRoot = app.config.webRoot;

	app.get(webRoot + '/', routes.frontend.index);
	app.post(webRoot + '/', routes.frontend.login);

	app.get(webRoot + '/install', routes.frontend.install);

	app.get(webRoot + '/api/plex/currentlyWatching', routes.api.plex.currentlyWatching);
	app.get(webRoot + '/api/plex/poster', routes.api.plex.poster);
	app.get(webRoot + '/api/plex/recentlyAddedMovies', routes.api.plex.recentlyAddedMovies);
	app.get(webRoot + '/api/plex/recentlyAired', routes.api.plex.recentlyAired);

	app.get(webRoot + '/api/sabnzbd/history', routes.api.sabnzbd.getHistory);
	app.get(webRoot + '/api/sabnzbd/pauseQueue', routes.api.sabnzbd.pauseQueue);
	app.get(webRoot + '/api/sabnzbd/queue', routes.api.sabnzbd.getQueue);
	app.get(webRoot + '/api/sabnzbd/queue/:nzb/:func', routes.api.sabnzbd.itemOptions);
	app.get(webRoot + '/api/sabnzbd/queue/:nzb/:func/:value', routes.api.sabnzbd.itemOptions);
	app.get(webRoot + '/api/sabnzbd/resumeQueue', routes.api.sabnzbd.resumeQueue);

	app.get(webRoot + '/api/sickbeard/poster', routes.api.sickbeard.poster);
	app.get(webRoot + '/api/sickbeard/showsStats', routes.api.sickbeard.showsStats);
	app.get(webRoot + '/api/sickbeard/upcoming', routes.api.sickbeard.upcoming);

	app.get(webRoot + '/stats/all', routes.stats.all);
	app.get(webRoot + '/stats/bandwidth', routes.stats.bandwidth);
	app.get(webRoot + '/stats/cpu', routes.stats.cpu);
	app.get(webRoot + '/stats/disks', routes.stats.disks);
	app.get(webRoot + '/stats/memory', routes.stats.memory);
	app.get(webRoot + '/stats/services', routes.stats.services);
	app.get(webRoot + '/stats/weather', routes.stats.weather);

}).then(function() {
	var server = http.createServer(app);

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
				console.log('\t', reason.suggestion);
			}
		} else {
			logger.error(reason.message);
			console.log(reason);
		}
	} else {
		logger.fatal(reason);
	}
});
