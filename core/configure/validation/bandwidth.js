var bcrypt 		= require('bcrypt')
  , fs 			= require('fs')
  , path 		= require('path')
  , when 		= require('when')
  , _ 			= require('underscore');

var appRoot 	= path.resolve(__dirname, '../../../')
  , paths 		= require(appRoot + '/core/paths');

var log 		= require(paths.logger)('CONFIG')
  , common		= require(paths.core + '/common')
  , Bandwidth 	= require(paths.stats + '/bandwidth');

function validate(data) {
	var defer	= when.defer()
	  , servers	= [];

	_.each(data.data.bandwidthServers, function(server, label) {
		 servers.push(create(server, label).then(common.validateRemoteHost).then(function(data) {
			return when.resolve(new Bandwidth(data.options));
		}));
	});

	when.all(servers).then(function(results) {
		log.info('Validated bandwidth servers configuration.'.green);
		data.config.bandwidth = results;
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
		error.reason = 'Missing label for one of the bandwidth server.';

		var printObj = '{\n' + log.printObject(server, 2) + '\n\t\t},';
		error.suggestion = '\t\t"Home Server": ' + printObj;
		error.currently = '\t\t"": ' + printObj;

		return when.reject(error);
	}

	var options = {
		label: label,
		'default': (server['default']) ? true : false,

		vnstatPath: (_.isString(server.vnstatPath)) ? server.vnstatPath : 'vnstat',
		vnstatDBDirectory: (_.isString(server.vnstatDBDirectory)) ? server.vnstatDBDirectory : false,

		interface: (_.isString(server.interface)) ? server.interface : 'eth0',
		max: (server.maxSpeed) ? server.maxSpeed : [100, 100],
	};

	options.cap = (_.isString(server.cap) && server.cap != "") ? server.cap : false;

	return when.resolve({server: server, options: options});
}

module.exports 	= validate;
