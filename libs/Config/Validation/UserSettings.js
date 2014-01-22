var bcrypt 		= require('bcrypt')
  , fs 			= require('fs')
  , path 		= require('path')
  , when 		= require('when')
  , _ 			= require('underscore');

var appRoot 	= path.resolve(__dirname, '../../../')
  , cachePath 	= path.join(appRoot, 'cache')
  , libsPath 	= path.join(appRoot, 'libs');

var log 		= require(path.join(libsPath, 'Logger'))('CONFIG');

module.exports 	= function validateUserSettings(data) {

	var password = data.data.userPassword;
	var testCharFirst = password.substr(0, 1);
	var testCharLast = password.substr(-1, 1);

	log.debug('Checking to see if password is present and encrypted.');
	
	if(testCharFirst == '[' && testCharLast == ']') {
		log.debug('Present and encrypted, moving on!');
		data.config.user = {
			id: 1,
			username: (data.data.username) ? data.data.username : '',
			password: password.substr(1, password.length - 2)
		};

		return when.resolve(data);
	} else {
		log.debug('Going to attempted to encrypt password and re-save config file.');

		var promise = when.defer();

		bcrypt.hash(password, data.config.salt, function(err, hash) {
			if(err) return promise.reject(err);

			fs.readFile(configFile, function(err, file) {
				if(err) return promise.reject(err);

				var tempHash = hash.replace('$1', '$!!1').replace('$2', '$!!2');
				var re = new RegExp('"userPassword":(\\s*)(["\']+)' + password + '(["\']+)');
				var res = file = String(file).replace(re, '"userPassword":$1$2[' + tempHash + ']$3').replace(tempHash, hash);

				fs.writeFile(configFile, file, function(err) {
					if(err) return promise.reject(err);
					log.debug('New encrypted password save in config file.');

					data.config.user = {
						id: 1,
						username: (data.data.username) ? data.data.username : '',
						password: hash
					};
					promise.resolve(data);
				});

			});
		});

		return promise.promise;
	}
};
