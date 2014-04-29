var bcrypt 		= require('bcrypt-nodejs')
  , fs 			= require('fs')
  , path 		= require('path')
  , when 		= require('when')
  , _ 			= require('underscore');

var appRoot 	= path.resolve(__dirname, '../../../')
  , paths 		= require(appRoot + '/core/paths');

var log 		= require(paths.logger)('CONFIG');

module.exports 	= function validateSalt(data) {

	log.debug('Checking to see if salt has been generated.');
	if(!data.data.salt) {
		var promise = when.defer();

		var configFile = paths.app + '/config.js';

		log.debug('Salt is not present. Generating salt and save new config file.');
		data.config.salt = bcrypt.genSaltSync(10);

		fs.readFile(configFile, function(err, file) {
			if(err) return promise.reject(err);

			file = String(file).trim() + '\nconfig.salt = "' + data.config.salt + '";';
			fs.writeFile(configFile, file, function(err) {
				if(err) return promise.reject(err);

				promise.resolve(data);
			});
		});

		return promise.promise;

	} else {
		log.debug('Salt is present, moving on!');

		data.config.salt = data.data.salt;
		return when.resolve(data);
	}
};
