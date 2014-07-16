var bcrypt 			= require('bcryptjs')
  , when    		= require('when')
  , _    			= require('underscore')
  , fs 				= require('fs')
  , path 			= require('path');

var appRoot 		= path.resolve(__dirname, '../../')
  , paths 			= require(appRoot + '/core/paths');

var requirements	= require(paths.core + '/configure/requirements')
  , validation 		= require(paths.core + '/configure/validation')
  , log 			= require(paths.logger)('CONFIG');

function Config(app, configFile) {
	var promise = when.defer();

	var validators = [
		'SiteSettings',
		'Salt',
		'UserSettings',
		'GoogleAnalytics',
		'Memory',
		'Drives',
		'Bandwidth',
		'Services',

		'SABnzbd',
		'Sickbeard',
		'Plex',
		'Weather',
	];

	var config = getConfigData(configFile).then(requirements(app));

	log.debug('Loading configuration data.')

	validators.forEach(function(validator) {
		config = config.then(validation[validator]);
	});

	config.then(function(data) {
		log.info('Good to launch! All configuration has been validated and tested!'.green);

		app.config = data.config;

		promise.resolve(app);
	}).otherwise(promise.reject);

	return promise.promise;
}

function getConfigData(configFile) {
	log.debug('Loading configuration file at,', configFile.yellow);
	var configData = require(configFile);

	if(configData.version < 2) {
		var err = new Error('INVALID_CONFIG');
		err.reason = 'There is a new version of the config.js file.';
		err.suggestion = 'Rename the config.js-sample to config.js and add your information to config.js';
		return when.reject(err);
	}

	return when.resolve({data: configData, config: {}});
}

exports = module.exports = Config;
