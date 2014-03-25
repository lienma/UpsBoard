var bcrypt 		= require('bcrypt')
  , fs 			= require('fs')
  , path 		= require('path')
  , when 		= require('when')
  , _ 			= require('underscore');

var appRoot		= path.resolve(__dirname, '../../../')
  , paths		= require(appRoot + '/core/paths');

var log			= require(paths.logger)('CONFIG')
  , remote		= require(paths.core + '/configure/remote')
  , Memory		= require(paths.stats + '/memory');

function validate(data) {
	var defer	= when.defer()
	  , servers	= [];

	_.each(data.data.memory, function(server, label) {
		 servers.push(create(server, label).then(remote).then(function(data) {
			return when.resolve(new Memory(data.options));
		}));
	});

	when.all(servers).then(function(results) {
		log.info('Validated memory servers configuration.'.green);
		data.config.memory = results;
		defer.resolve(data);
	}).otherwise(function(reason) {
		var error = new Error('INVALID_CONFIG');

		if(reason.reason) {
			error.reason = reason.reason;
		} else {
			var suggestion = util.format('Please check your cofiguration for memory server labelled, %s.', (reason.options) ? reason.options.label : '');

			switch(reason.message) {
				case 'USERNAME':
					error.reason = 'Username is required for getting memory statistics from remote server.';
					error.suggestion = suggestion;
					break;
				case 'NO_AUTHENTICATION':
					error.reason = 'There is no authenication type present for remote server.';
					error.suggestion = suggestion;
					break;
			}
		}

		defer.reject((error.reason) ? error : reason);
	});

	return defer.promise;
}

function create(server, label) {
	if(_.isEmpty(label)) {
		var error = new Error('INVALID_CONFIG');
		error.reason = 'Missing label for one of the memory .';

		var printObj = '{\n' + log.printObject(server, 2) + '\n\t\t},';
		error.suggestion = '\t\t"Home Server": ' + printObj;
		error.currently = '\t\t"": ' + printObj;

		return when.reject(error);
	}

	var options = {
		label: label,
		'default': (server['default']) ? true : false,
		remote: (server.remote) ? true : false
	};

	return when.resolve({server: server, options: options});
}

module.exports 	= validate;
