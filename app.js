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
  , Common			= require(paths.core + '/common')
  , logger			= require(paths.logger)('MAIN_APP');

var app				= express();

var bodyParser 		= require('body-parser')
  , cookieParser	= require('cookie-parser')
  , csrf			= require('csurf')
  , errorHandler	= require('errorhandler')
  , methodOverride	= require('method-override')
  , morganLogger	= require('morgan')
  , responseTime	= require('response-time')
  , session			= require('cookie-session')
  , serveStatic		= require('serve-static')
  , favicon			= require('static-favicon');


if(process.env.NODE_ENV == 'development') {
	require('when/monitor/console');
}

if(os.type() == 'Windows_NT') {
	console.fatal('UpsBoard only works on Linux operating system, and also Mac with limited features.');
	process.exit(0);
}

logger.info('Starting up app in', (process.env.NODE_ENV) ? process.env.NODE_ENV : 'unknown', 'environment.');

Configure().then(function(conf) {
	app.config = conf;

	app.isMacOs = (os.type() == 'Linux') ? false : true;

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

	//app.use(app.config.webRoot, favicon());

	app.use(bodyParser());
	app.use(methodOverride());
	app.use(cookieParser());
	app.use(session({ secret: conf.salt, cookie: { maxAge: 24 * 60 * 60 * 1000 } }));
	app.use(csrf());


	app.use(app.config.webRoot, stylus.middleware({src: paths.public, compile: function(str, path) { return stylus(str).set('filename', path) .use(nib()) }}));
	app.use(app.config.webRoot + '/templates', Common.templateFormat);


	if(app.config.logHttpRequests) {
		app.use(morganLogger((conf.runningMode == 'normal') ? '' : 'dev'));
	}

	if(conf.runningMode == 'normal') {
		app.enable('trust proxy');
		app.set('json spaces', 0)

		function blankLog() { this.log = function() {}; }

		app.use(app.config.webRoot, expressUglify.middleware({ src: paths.public, logger: new blankLog() }));
		app.use(app.config.webRoot, serveStatic(paths.public, { maxAge: 31557600000 }));
		app.use(errorHandler());
	} else {
		app.locals.pretty = true;
		app.use(responseTime());

		app.use(app.config.webRoot, serveStatic(paths.public));
		app.use(errorHandler({ dumpExceptions: true, showStack: true }));
	}

	app.use(passport.initialize());
	app.use(passport.session());

}).then(function() {

	var webRoot = app.config.webRoot;

	app.get(webRoot + '/', routes.frontend.index);
	app.post(webRoot + '/', routes.frontend.login);

	app.get(webRoot + '/avatar', routes.user.avatar);

	app.get(webRoot + '/api/plex/currentlyWatching', routes.api.plex.currentlyWatching);
	app.get(webRoot + '/api/plex/poster', routes.api.plex.poster);
	app.get(webRoot + '/api/plex/recentlyAddedMovies', routes.api.plex.recentlyAddedMovies);
	app.get(webRoot + '/api/plex/recentlyAired', routes.api.plex.recentlyAired);

	app.get(webRoot + '/api/sabnzbd/history', routes.api.sabnzbd.getHistory);
	app.get(webRoot + '/api/sabnzbd/pauseQueue', routes.api.sabnzbd.pauseQueue);
	app.get(webRoot + '/api/sabnzbd/queue', routes.api.sabnzbd.getQueue);
	app.get(webRoot + '/api/sabnzbd/resumeQueue', routes.api.sabnzbd.resumeQueue);
	app.get(webRoot + '/api/sabnzbd/:list/:nzb/:func', routes.api.sabnzbd.itemOptions);
	app.get(webRoot + '/api/sabnzbd/:list/:nzb/:func/:value', routes.api.sabnzbd.itemOptions);

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
