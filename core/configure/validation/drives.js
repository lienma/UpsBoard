var when		= require('when')
  , fs 			= require('fs')
  , path 		= require('path')
  , util		= require('util')
  , when 		= require('when')
  , _ 			= require('underscore');

var appRoot 	= path.resolve(__dirname, '../../../')
  , paths 		= require(appRoot + '/core/paths');

var log 		= require(paths.logger)('CONFIG')
  , common		= require(paths.core + '/common')
  , remote		= require(paths.core + '/configure/remote')
  , Drive 		= require(paths.stats + '/drive')


function validate(data) {
	var defer	= when.defer()
	  , drives	= [];

	_.each(data.data.drives, function(drive, label) {
		 drives.push(createDrive(drive, label).then(remote).then(returnDrive));
	});

	when.all(drives).then(function(results) {
		log.info('Validated configuration for your drives.'.green);

		data.config.drives = results;
		defer.resolve(data);
	}).otherwise(function(reason) {
		var error = new Error('INVALID_CONFIG');

		if(reason.reason) {
			error.reason = reason.reason;
		} else {
			var suggestion = util.format('Please check your cofiguration for drive labelled, %s.', (reason.options) ? reason.options.label : '');

			switch(reason.message) {
				case 'USERNAME':
					error.reason = 'Username is required for getting remote drive statistics.';
					error.suggestion = suggestion;
					break;
				case 'NO_AUTHENTICATION':
					error.reason = 'There is no authenication type present for remote drive.';
					error.suggestion = suggestion;
					break;
			}
		}

		defer.reject((error.reason) ? error : reason);
	});

	return defer.promise;
}

function createDrive(drive, label) {
	if(_.isEmpty(label)) {
		var error = new Error('INVALID_CONFIG');
		error.reason = 'Missing label for one of the drives.';

		var printObj = '{\n' + log.printObject(drive, 2) + '\n\t\t},';
		error.suggestion = '\t\t"Main Hard Drive": ' + printObj;
		error.currently = '\t\t"": ' + printObj;

		return when.reject(error);
	}

	var options	= {
		label:		label,
		location:	(_.isString(drive.location)) ? drive.location : '/',
		remote:		(drive.remote) ? true : false
	};

	if(drive.total) {
		var total = String(drive.total);
		if(!common.bytesRegEx.test(total)) {
			var error = new Error('INVALID_CONFIG');
			error.reason = 'Invalid total drive space for drive ' + label + ', needs to be in the proper format';
			error.suggestion = util.format('Please check your cofiguration for drive labelled, %s.', reason.options.label);
			return when.reject(error);
		}
		options.total = common.getBytes(total);
	}

	if(drive.icon) {
		options.icon = drive.icon;
	}

	return when.resolve({server: drive, options: options});
}

function returnDrive(data) {
	return when.resolve(new Drive(data.options));
}

module.exports 	= validate;
