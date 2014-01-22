var bcrypt 		= require('bcrypt')
  , fs 			= require('fs')
  , path 		= require('path')
  , when 		= require('when')
  , _ 			= require('underscore');

var appRoot 	= path.resolve(__dirname, '../../../')
  , cachePath 	= path.join(appRoot, 'cache')
  , libsPath 	= path.join(appRoot, 'libs');

var log 		= require(path.join(libsPath, 'Logger'))('CONFIG');

module.exports 	= function validateSalt(data) {

	log.debug('Checking to see if salt has been generated.');
	if(!data.data.salt) {
		var promise = when.defer();

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
