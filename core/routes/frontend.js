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

	if(req.session.message) {
		var status = req.session.message;
		req.session.message = false;
	}

	var message = getMessage(status);
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

		seed: process.pid,

		token: req.csrfToken(),

		title: 'UpStats Board',

		updateMsg: req.app.updater.updateMsg(),

		weatherEnabled: (config.weather.enabled) ? 'true' : 'false',
		weatherLat: config.weather.latitude,
		weatherLocation: config.weather.latitude + ',' + config.weather.longitude,
		weatherLong: config.weather.longitude,

		webRoot: (config.webRoot == '/') ? '' : config.webRoot
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

exports.update = function(req, res, next) {
	if(req.isAuthenticated()) {
		if(req.param('pid') == process.pid) {
			req.app.updater.checkForUpdate().then(function(needUpdate) {
				if(needUpdate) {

					res.render('update', {
						seed: process.pid,
						title: 'Updating UpsBoard',
						webRoot: (req.app.config.webRoot == '/') ? '' : req.app.config.webRoot
					});

					req.app.updater.doUpdate();
				} else {
					req.session.message = 'NO_UPDATE_NEEDED';
					res.redirect(res.app.config.webRoot + '/');
				}
			});
		} else {
			res.redirect(res.app.config.webRoot + '/');
		}
	} else {
		req.session.message = 'UPDATE_NEED_LOGIN';
		res.redirect(res.app.config.webRoot + '/');
	}
};

exports.alive = function(req, res, next) {
	res.json({
		pid: process.pid
	});
};

function getMessage(status) {
	switch(status) {
		case 'LOGIN_FAILED':
			return ['error', 'Login Failed! Please check the username and password and try again.'];

		case 'NO_UPDATE_NEEDED':
			return ['info', 'There is no update available.'];

		case 'UPDATE_NEED_LOGIN':
			return ['error', 'You must login to perfrom an update.'];

	}
	return false;
};

