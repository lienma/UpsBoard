var bcrypt 		= require('bcryptjs')
  , crypto		= require('crypto')
  , fs 			= require('fs')
  , path 		= require('path')
  , when 		= require('when')
  , _ 			= require('underscore');

var appRoot 	= path.resolve(__dirname, '../../../')
  , paths 		= require(appRoot + '/core/paths');

var log 		= require(paths.logger)('CONFIG');

module.exports 	= function validateUserSettings(data) {
	return password(data).then(avatar);
};

function password(data) {
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

		bcrypt.hash(password, data.config.salt, false, function(err, hash) {
			if(err) return promise.reject(err);

			fs.readFile(paths.app + '/config.js', function(err, file) {
				if(err) return promise.reject(err);

				var tempHash = hash.replace('$1', '$!!1').replace('$2', '$!!2');
				var re = new RegExp('"userPassword":(\\s*)(["\']+)' + password + '(["\']+)');
				var res = file = String(file).replace(re, '"userPassword":$1$2[' + tempHash + ']$3').replace(tempHash, hash);

				fs.writeFile(paths.app + '/config.js', file, function(err) {
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
}

function avatar(data) {

	var avatar = (data.data.userAvatar) ? data.data.userAvatar : '';

	var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(re.test(avatar)) {
		var baseURL = 'https://secure.gravatar.com/avatar/';
		data.config.user.avatar = 'url';
		data.config.user.avatarUrl = baseURL + crypto.createHash('md5').update(avatar.toLowerCase().trim()).digest('hex');
	} else {
		data.config.user.avatar = avatar;
	}

	return when.resolve(data);
};
