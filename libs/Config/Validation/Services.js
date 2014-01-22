var bcrypt 		= require('bcrypt')
  , fs 			= require('fs')
  , path 		= require('path')
  , when 		= require('when')
  , _ 			= require('underscore');

var appRoot 	= path.resolve(__dirname, '../../../')
  , cachePath 	= path.join(appRoot, 'cache')
  , libsPath 	= path.join(appRoot, 'libs');

var log 		= require(path.join(libsPath, 'Logger'))('CONFIG')
  , Service 	= require(path.join(libsPath, 'Service'));

module.exports 	= function validateServices(data) {
	var services = [];

	for(var label in data.data.services) {
		if(data.data.services.hasOwnProperty(label)) {
			var service = data.data.services[label];

			if(_.isEmpty(label)) {
				var error = new Error('INVALID_CONFIG');
				error.reason = 'Missing label for one of the monitoring services.';

				var printObj = '{\n' + log.printObject(service, 2) + '\n\t\t},';
				error.suggestion = '\t\t"WebSite": ' + printObj;
				error.currently = '\t\t"": ' + printObj;

				return when.reject(error);
			}


			if(!_.isString(service.host) || _.isEmpty(service.host)) {
				var error = new Error('INVALID_CONFIG');
				error.reason = 'A host must be specified for this monitoring service, ' + label;
				return when.reject(error);
			}

			if(!_.isNumber(service.port)) {
				var error = new Error('INVALID_CONFIG');
				error.reason = 'A port must be specified for this monitoring service, ' + label;
				return when.reject(error);
			}

			services.push(new Service(service.host, service.port, {
				label: label, url: (service.url) ? service.url : '',
				loginRequired: (service.loginRequired) ? service.loginRequired : false
			}));
		}
	}

	log.info('Validated monitoring services configuration'.green);
	data.config.services = services;
	return when.resolve(data);
};