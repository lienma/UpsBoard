var bcrypt 		= require('bcrypt')
  , when    	= require('when')
  , _    		= require('underscore')
  , fs 			= require('fs')
  , path 		= require('path');

var appRoot 	= path.resolve(__dirname, '../', '../')
  , cachePath 	= path.join(appRoot, 'cache')
  , libsPath 	= path.join(appRoot, 'libs');

var Sabnzbd 	= require(path.join(libsPath, 'Sabnzbd'))
  , Validation 	= require(path.join(libsPath, 'Config', 'Validation')); 

var log 		= require(path.join(libsPath, 'Logger'))('CONFIG');

var configData 	= require(path.join(appRoot, 'config.js'));

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
		config = config.then(Validation[validator]);
	});

	config.then(function(data) {
		log.info('Good to launch! All configuration has been validated and tested!'.green);

		promise.resolve(data.config);
	}).otherwise(promise.reject);

	return promise.promise;
}

function getPaths() {
	return {
		'appRoot': appRoot,
		'cache': cachePath,
		'libs': libsPath
	};
}

function getConfigData() {
	var config = {
		paths: getPaths
	};

	return when.resolve({data: configData, config: config});
}

exports = module.exports = Config;
