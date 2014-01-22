var _ = require('underscore');

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


	res.render('index', {
		debugStopUpdating: (req.app.config.debugStopUpdating) ? 'true' : 'false',

		googleAnalytics: req.app.config.googleAnalytics,
		googleAnalyticsId: req.app.config.googleAnalyticsId,
		googleAnalyticsUrl: req.app.config.googleAnalyticsUrl,

		isLoggedIn: req.isAuthenticated(),
		isMacOs: req.app.isMacOs,

		message: message,
		messageDegree: messageDegree,

		token: req.csrfToken(),

		title: 'UpStats Board',

		weatherEnabled: (req.app.config.weather.enabled) ? 'true' : 'false',
		weatherLat: req.app.config.weather.latitude,
		weatherLocation: req.app.config.weather.latitude + ',' + req.app.config.weather.longitude,
		weatherLong: req.app.config.weather.longitude,

		webRoot: (req.app.config.webRoot == '/') ? '' : req.app.config.webRoot,
	});
};

exports.login = function(req, res, next) {
	req._passport.instance.authenticate('local', function(err, user, info) {
console.log('err'.red, err);
console.log('user'.red, user);
console.log('info'.red, info);


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
