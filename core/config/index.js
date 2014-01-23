var bcrypt 		= require('bcrypt')
  , when    	= require('when')
  , _    		= require('underscore')
  , fs 			= require('fs')
  , path 		= require('path');

var appRoot 	= path.resolve(__dirname, '../../')
  , paths 		= require(appRoot + '/core/paths');

var validation 	= require(paths.core + '/config/validation')
  , log 		= require(paths.logger)('CONFIG')
  , configData 	= require(paths.app + '/config.js');

if(configData.runningMode == 'debug' && process.env.NODE_ENV == 'development') {
	require('when/monitor/console');
}

function Config() {
	var promise = when.defer();

	log.debug('Loading configuration data.')

	var validators = [
		'SiteSettings',
		'Salt',
		'UserSettings',
		'GoogleAnalytics',
		'Drives',
		'Bandwidth',
		'Services',

		'Sickbeard',
		'Plex',
		'Weather',
	];

	var config = getConfigData();
	validators.forEach(function(validator) {
		config = config.then(validation[validator]);
	});

	config.then(function(data) {
		log.info('Good to launch! All configuration has been validated and tested!'.green);

		promise.resolve(data.config);
	}).otherwise(promise.reject);

	return promise.promise;
}

function getConfigData() {
	return when.resolve({data: configData, config: {}});
}

exports = module.exports = Config;
