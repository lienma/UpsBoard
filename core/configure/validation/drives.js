var bcrypt 		= require('bcrypt')
  , fs 			= require('fs')
  , path 		= require('path')
  , when 		= require('when')
  , _ 			= require('underscore');

var appRoot 	= path.resolve(__dirname, '../../../')
  , paths 		= require(appRoot + '/core/paths');

var log 		= require(paths.logger)('CONFIG')
  , common 		= require(paths.core + '/common')
  , Drive 		= require(paths.stats + '/drive')

module.exports 	= function validateDrives(data) {
	var drives = [];

	for(var label in data.data.drives) {
		if(data.data.drives.hasOwnProperty(label)) {
			var drive = data.data.drives[label];

			var remote 		= (drive.remote) ? true : false
			  , location	= (_.isString(drive.location)) ? drive.location : '/'
			  , options 	= {};

			if(_.isEmpty(label)) {
				var error = new Error('INVALID_CONFIG');
				error.reason = 'Missing label for one of the drives.';

				var printObj = '{\n' + log.printObject(drive, 2) + '\n\t\t},';
				error.suggestion = '\t\t"Main Hard Drive": ' + printObj;
				error.currently = '\t\t"": ' + printObj;

				return when.reject(error);
			}



			if(remote) {
				if(!_.isString(drive.username) || _.isEmpty(drive.username)) {
					var error = new Error('INVALID_CONFIG');
					error.reason = 'Username is required for getting remote drive statistics.';
					return when.reject(error);
				}

				options = {
					remote: true,
					host: (_.isString(drive.host)) ? drive.host : 'localhost',
					port: (_.isNumber(drive.port)) ? drive.port : 22,
					username: drive.username,
					password: (_.isString(drive.password)) ? drive.password : ''
				};
			}

			if(drive.total) {
				var total = String(drive.total);
				if(!common.bytesRegEx.test(total)) {
					var error = new Error('INVALID_CONFIG');
					error.reason = 'Invalid total drive space for drive ' + label + ', needs to be in the proper format';
					return when.reject(error);
				}
				options.total = common.getBytes(total);
			}

			if(drive.icon) {
				options.icon = drive.icon;
			}

			drives.push(new Drive(label, location, options));
		}
	}

	log.info('Validated drives configuration'.green);
	data.config.drives = drives;
	return when.resolve(data);
};
