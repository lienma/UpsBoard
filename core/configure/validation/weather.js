var bcrypt 		= require('bcrypt-nodejs')
  , fs 			= require('fs')
  , path 		= require('path')
  , when 		= require('when')
  , _ 			= require('underscore');

var appRoot 	= path.resolve(__dirname, '../../../')
  , paths 		= require(appRoot + '/core/paths');

var log 		= require(paths.logger)('CONFIG');

module.exports 	= function validateWeather(data) {
	if(data.data.weather && _.isString(data.data.weather.apiKey)) {
		var weather = data.data.weather;

		if(!_.isString(weather.apiKey) || _.isEmpty(weather.apiKey)) {
			return when.reject(new Error('Forecast.io Api key is required.'));
		}

		if(!_.isString(weather.lat) || _.isEmpty(weather.lat)) {
			return when.reject(new Error('The weather module requires a latitude.'));
		}
		if(!_.isString(weather.long) || _.isEmpty(weather.long)) {
			return when.reject(new Error('The weather module requires a longitude.'));
		}

		data.config.weather = {
			enabled: true,
			apiKey: weather.apiKey,
			latitude: weather.lat,
			longitude: weather.long,
			useFahrenheit: (weather.useFahrenheit) ? true : false
		};

		log.info('Validated Forecast.io weather configuration'.green);
	} else {
		data.config.weather = {
			enabled: false,
			apiKey: '',
			latitude: '',
			longitude: '',
			useFahrenheit: true
		};
		log.debug('No Forecase.io api key present. Weather module is disabled.');
	}

	return when.resolve(data);
};

