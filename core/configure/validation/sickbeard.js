var bcrypt 		= require('bcrypt')
  , fs 			= require('fs')
  , path 		= require('path')
  , when 		= require('when')
  , _ 			= require('underscore');

var appRoot 	= path.resolve(__dirname, '../../../')
  , paths 		= require(appRoot + '/core/paths');

var log 		= require(paths.logger)('CONFIG')
  , SickBeard 	= require(paths.api + '/sickbeard');

module.exports 	= function validateSickbeard(data) {
	var promise = when.defer();
	var sbData = data.data.sickbeard;

	if(!sbData || sbData.disable) {
		data.config.sickbeard = {
			enabled: false
		};

		log.debug('Sick Beard is disabled, moving on!')
		return when.resolve(data);
	}


	if(!_.isString(sbData.apiKey) || _.isEmpty(sbData.apiKey)) {
		var error = new Error('INVALID_CONFIG');
		error.reason = 'A Sick Beard api key is required to run this app.';
		return when.reject(error);
	}

	var options = {
		protocol: (_.isString(sbData.protocol)) ? sbData.protocol : 'http://',
		host: (_.isString(sbData.host)) ? sbData.host : 'localhost',
		port: (_.isNumber(sbData.port)) ? sbData.port : 8081,
		webRoot: (_.isString(sbData.webRoot)) ? sbData.webRoot : '',
		apiKey: sbData.apiKey
	};

	if(_.isString(sbData.url)) {
		options.url = sbData.url;
	} else {
		options.url = options.protocol + options.host + ':' + options.port + '/' + options.webRoot;
	}

	var sickbeardCacheFolder = path.join(paths.cache, 'sickbeard');
	var cacheFolderExists = fs.existsSync(sickbeardCacheFolder);
	log.debug('Does Sick Beard cache folder exist? ' + cacheFolderExists);

	if(!cacheFolderExists) {
		log.debug('Creating cache folder for Sick Beard.');
		fs.mkdirSync(sickbeardCacheFolder);
	}

	var sickbeard = new SickBeard(options);

	log.debug('Testing Sick Beard\'s api key');
	sickbeard.ping().then(function() {
		log.debug('Ping was successful to Sick Beard.');

		log.info('Validated Sick Beard configuration'.green);
		data.config.sickbeard = sickbeard;
		data.config.sickbeard.enabled = true;
		promise.resolve(data);

	}).otherwise(function(reason) {
		if(reason.message == 'DENIED' || reason.message == 'WRONG_SETTINGS') {
			return promise.reject(reason.reason);
		}

		promise.reject(reason);
	});

	return promise.promise;
};
