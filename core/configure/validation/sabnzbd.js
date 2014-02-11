var bcrypt		= require('bcrypt')
  , fs			= require('fs')
  , path		= require('path')
  , when		= require('when')
  , _			= require('underscore');

var appRoot		= path.resolve(__dirname, '../../../')
  , paths		= require(appRoot + '/core/paths');

var log			= require(paths.logger)('CONFIG')
  , Sabnzbd		= require(paths.api + '/sabnzbd');

var name		= 'SABnzbd';

module.exports 	= function validateSabnzbd(data) {
	var defer = when.defer();
	var sabData = data.data.sabnzbd;

	if(!sabData || sabData.disable) {
		data.config.sabnzbd = {
			enabled: false
		};

		log.debug(name, 'is disabled, moving on!')
		return when.resolve(data);
	}

	if(!_.isString(sabData.apiKey) || _.isEmpty(sabData.apiKey)) {
		log.debug('No api present, assuming', name, 'does\'t need the api to work');
	}

	var options = {
		protocol: (_.isString(sabData.protocol)) ? sabData.protocol : 'http://',
		host: (_.isString(sabData.host)) ? sabData.host : 'localhost',
		port: (_.isNumber(sabData.port)) ? sabData.port : 8080,
		webRoot: (_.isString(sabData.webRoot)) ? sabData.webRoot : 'sabnzbd',
		apiKey: (_.isString(sabData.apiKey)) ? sabData.apiKey : ''
	};

	if(_.isString(sabData.url)) {
		options.url = sabData.url;
	} else {
		options.url = options.protocol + options.host + ':' + options.port + '/' + options.webRoot;
	}

	var sabnzbd = new Sabnzbd(options);

	log.debug('Testing connection to', name);
	sabnzbd.ping().then(function() {
		log.debug('Ping was successful to ' + name + '.');

		log.info('Validated'.green, name.green, 'configuration'.green);
		data.config.sabnzbd = sabnzbd;
		data.config.sabnzbd.enabled = true;
		defer.resolve(data);

	}).otherwise(function(reason) {
		if(reason.message == 'DENIED' || reason.message == 'WRONG_SETTINGS') {
			return defer.reject(reason.reason);
		}

		defer.reject(reason);
	});


	return defer.promise;
};

