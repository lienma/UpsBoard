var exec		= require('child_process').exec
  , fs 			= require('fs')
  , parallel	= require('when/parallel')
  , path 		= require('path')
  , when 		= require('when')
  , _ 			= require('underscore');

var appRoot 	= path.resolve(__dirname, '../../')
  , paths 		= require(appRoot + '/core/paths');

var log 		= require(paths.logger)('REQUIREMENTS');

module.exports	= function requirements(app) {
	return function(data) {
		var defer	= when.defer()
		  , checks	= [GraphicsMagick];

		var promises = parallel(checks, data);
		promises.then(function(results) {
			app._GrapichsMagick = results[0];

			log.info('All requirement checks have passed!'.green);
			defer.resolve(data);
		}).otherwise(defer.reject);


		return defer.promise;
	};
};

function GraphicsMagick(data) {
	var defer = when.defer();

	log.debug('Checking to see if GrpahicsMagick is present and meets minimum requirements.');

	var bin = (data.data.gmPath) ? data.data.gmPath : 'gm';

	exec(bin + ' -version', function(err, stdout, stderr) {
		if(err) {
			if(/not found/.test(err.message)) {
				log.error('GraphicsMagick was not detected on the machine. We are not going to use GrpahicsMagick to resize images. This will cause full size images being sent to the user\'s browser.');
				return defer.resolve(false);
			} else {
				return defer.reject(err);
			}
		}

		var find = stdout.split('\n')[0].match(/GraphicsMagick ((\d+).(\d+).(\d+))/);
		if(!(find[2] >= 1 && find[3] >= 3)) {
			log.warn('The version of', find[0], 'is outdated, it may not work properly. The minimum required version is 1.3.x');
		}

		defer.resolve(true);
	});

	return defer.promise;
};
