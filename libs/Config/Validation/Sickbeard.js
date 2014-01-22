var bcrypt 		= require('bcrypt')
  , fs 			= require('fs')
  , path 		= require('path')
  , when 		= require('when')
  , _ 			= require('underscore');

var appRoot 	= path.resolve(__dirname, '../../../')
  , cachePath 	= path.join(appRoot, 'cache')
  , libsPath 	= path.join(appRoot, 'libs');

var log 		= require(path.join(libsPath, 'Logger'))('CONFIG')
  , SickBeard 	= require(path.join(libsPath, 'SickBeard'));

module.exports 	= function validateSickbeard(data) {
	var promise = when.defer();
	var sbData = data.data.sickbeard;

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

	var sickbeard = new SickBeard(options);

	log.debug('Testing Sick Beard\'s api key');
	sickbeard.ping().then(function() {
		log.debug('Successful ping to Sick Beard.');

		log.info('Validated Sick Beard configuration'.green);
		data.config.sickbeard = sickbeard;
		promise.resolve(data);

	}).otherwise(function(reason) {
		if(reason.message == 'DENIED' || reason.message == 'WRONG_SETTINGS') {
			promise.reject(reason.reason);
		}
	});

	var sickbeardCacheFolder = path.join(cachePath, 'sickbeard');
	var cacheFolderExists = fs.existsSync(sickbeardCacheFolder);
	log.debug('Does Sick Beard cache folder exist? ' + cacheFolderExists);

	if(!cacheFolderExists) {
		log.debug('Creating cache folder for Sick Beard.');
		fs.mkdirSync(sickbeardCacheFolder);
	}

	return promise.promise;
};
