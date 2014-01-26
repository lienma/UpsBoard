var bcrypt 		= require('bcrypt')
  , fs 			= require('fs')
  , path 		= require('path')
  , when 		= require('when')
  , _ 			= require('underscore');

var appRoot 	= path.resolve(__dirname, '../../../')
  , paths 		= require(appRoot + '/core/paths');

var log 		= require(paths.logger)('CONFIG')
  , Bandwidth 	= require(paths.stats + '/bandwidth');

module.exports 	= function validateBandwidth(data) {
	var servers = [];

	for(var label in data.data.bandwidthServers) {
		if(data.data.bandwidthServers.hasOwnProperty(label)) {
			var server = data.data.bandwidthServers[label];
			var remote = (server.remote) ? true : false;

			var options = {
				label: label,
				'default': (server['default']) ? true : false,

				vnstatPath: (_.isString(server.vnstatPath)) ? server.vnstatPath : 'vnstat',
				vnstatDBDirectory: (_.isString(server.vnstatDBDirectory)) ? server.vnstatDBDirectory : false,

				interface: (_.isString(server.interface)) ? server.interface : 'eth0',
				max: (server.maxSpeed) ? server.maxSpeed : [100, 100],
				remote: remote
			};

			options.cap = (_.isString(server.cap) && server.cap != "") ? server.cap : false;

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
					error.reason = 'Username is required for getting bandwidth statistics from remote source.';
					return when.reject(error);
				}

				options.host = (_.isString(server.host)) ? server.host : 'localhost',
				options.port = (_.isNumber(server.port)) ? server.port : 22,
				options.username = server.username,
				options.password = (_.isString(server.password)) ? server.password : ''
			};
			servers.push(new Bandwidth(options));
		}
	}

	log.info('Validated bandwidth servers configuration.'.green);
	data.config.bandwidth = servers;
	return when.resolve(data);
};
