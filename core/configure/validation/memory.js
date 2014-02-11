var bcrypt 		= require('bcrypt')
  , fs 			= require('fs')
  , path 		= require('path')
  , when 		= require('when')
  , _ 			= require('underscore');

var appRoot 	= path.resolve(__dirname, '../../../')
  , paths 		= require(appRoot + '/core/paths');

var log 		= require(paths.logger)('CONFIG')
  , Memory		= require(paths.stats + '/memory');

module.exports 	= function validateMemory(data) {
	var servers = [];

	for(var label in data.data.memory) {
		if(data.data.memory.hasOwnProperty(label)) {
			var server = data.data.memory[label];
			var remote = (server.remote) ? true : false;

			var options = {
				label: label,
				'default': (server['default']) ? true : false,

				remote: remote
			};


			if(_.isEmpty(label)) {
				var error = new Error('INVALID_CONFIG');
				error.reason = 'Missing label for one of the drives.';

				var printObj = '{\n' + log.printObject(server, 2) + '\n\t\t},';
				error.suggestion = '\t\t"Home Server": ' + printObj;
				error.currently = '\t\t"": ' + printObj;

				return when.reject(error);

			}

			if(remote) {
				if(!_.isString(server.username) || _.isEmpty(server.username)) {
					var error = new Error('INVALID_CONFIG');
					error.reason = 'Username is required for getting memory statistics from remote source.';
					return when.reject(error);
				}

				options.host = (_.isString(server.host)) ? server.host : 'localhost',
				options.port = (_.isNumber(server.port)) ? server.port : 22,
				options.username = server.username,
				options.password = (_.isString(server.password)) ? server.password : ''
			};

			servers.push(new Memory(label, options));
		}
	}

	log.info('Validated memory servers configuration.'.green);
	data.config.memory = servers;
	return when.resolve(data);
};
