var fs 			= require('fs')
  , path 		= require('path')
  , when 		= require('when')
  , _ 			= require('underscore');

var appRoot 	= path.resolve(__dirname, '../../../')
  , cachePath 	= path.join(appRoot, 'cache')
  , libsPath 	= path.join(appRoot, 'libs');

var log 		= require(path.join(libsPath, 'Logger'))('CONFIG');

module.exports 	= function validateSiteSettings(data) {
	data.config.runningMode = (data.data.runningMode) ? data.data.runningMode : 'normal';

	data.config.host 	= (data.data.host) ? data.data.host : '0.0.0.0';
	data.config.port	= (data.data.port) ? data.data.port : 8084;
	data.config.webRoot = (data.data.webRoot || data.data.webRoot != '/') ? data.data.webRoot : '';

	data.config.debugStopUpdating = (data.data.debugStopUpdating) ? true : false;
	data.config.logHttpRequests = (data.data.logHttpRequests) ? true : false;

	if(!fs.existsSync(cachePath)) {
		log.debug('Cache folders does not exist. Attempting to create folder');
		fs.mkdirSync(cachePath);
	}

	log.info('Validated general configuration'.green);
	return when.resolve(data);
};
