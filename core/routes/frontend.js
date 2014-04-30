var _ 		= require('underscore')
  , path	= require('path');

var appRoot	= path.resolve(__dirname, '../../')
  , paths	= require(appRoot + '/core/paths');

exports.index = function(req, res, next) {
	if(!_.isUndefined(req.query.logout)) {
		if(req.isAuthenticated() && req.method == 'GET') {
			req.logout();
		}
		return res.redirect(req.app.config.webRoot + '/');
	}

	routerIndex(req, res);
};

function routerIndex(req, res, status) {
	var message = false, messageDegree = -1;

	switch(status) {
		case 'LOGIN_SUCCESSFUL':
			//message = 'Login was successful!';
			//messageDegree = 1;
			break;

		case 'LOGIN_FAILED':
			message = 'Login Failed! Please check the username and password and try again.';
			messageDegree = 2;
			break;
	}

	var config = req.app.config;

	res.render('index', {

		canUseSabnzbd: (config.sabnzbd.anyoneCanUse || req.isAuthenticated()),

		debugStopUpdating: (config.debugStopUpdating) ? 'true' : 'false',

		enabledSabnzbd: config.sabnzbd.enabled,
		enabledSickBeard: config.sickbeard.enabled,

		googleAnalytics: config.googleAnalytics,
		googleAnalyticsId: config.googleAnalyticsId,
		googleAnalyticsUrl: config.googleAnalyticsUrl,

		isLoggedIn: req.isAuthenticated(),
		isMacOs: req.app.isMacOs,

		message: message,
		messageDegree: messageDegree,

		seed: process.pid,

		token: req.csrfToken(),

		title: 'UpStats Board',

		weatherEnabled: (config.weather.enabled) ? 'true' : 'false',
		weatherLat: config.weather.latitude,
		weatherLocation: config.weather.latitude + ',' + config.weather.longitude,
		weatherLong: config.weather.longitude,

		webRoot: (config.webRoot == '/') ? '' : config.webRoot,
	});
};

exports.login = function(req, res, next) {
	req._passport.instance.authenticate('local', function(err, user, info) {
		if(user) {
			req.login(user, function(err) {
				routerIndex(req, res, 'LOGIN_SUCCESSFUL');
			});
		} else {
			routerIndex(req, res, 'LOGIN_FAILED');
		}
	})(req, res, next);
};

exports.install = function(req, res) {
	res.render('install', {
		title: 'Installing UpStats Board',
		webRoot: (req.app.config.webRoot == '/') ? '' : req.app.config.webRoot
	});
};
