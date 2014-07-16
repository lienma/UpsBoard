var argv			= require('minimist')(process.argv.slice(2))
  , colors			= require('colors')
  , forever			= require('forever-monitor')
  , path			= require('path');

var appRoot			= path.resolve(__dirname)
  , paths			= require(appRoot + '/core/paths');

var log				= require(paths.logger)('LAUNCHER');

var restart			= false;

var appOptions		= [];

if(argv.config) {
	appOptions.push('--config=' + argv.config);
}

if(argv.host) {
	appOptions.push('--host=' + argv.host);
}

if(argv.port) {
	appOptions.push('--port=' + argv.port);
}

if(argv.webroot) {
	appOptions.push('--webroot=' + argv.webroot);
}

function app() {
	var child = new (forever.Monitor)(appRoot + '/upsboard.js', {
		silent:		true,
		max:		1,
		options:	appOptions
	});

	child.on('stderr', function(data) {
		var msg = data.toString().trim();
		console.log(msg);
	});

	child.on('stdout', function(data) {
		var msg = data.toString().trim();

		if(msg == 'RESTART:' + child.child.pid) {
			restart = true;
			log.info('Restarting UpsBoard');
			child.stop();
		} else {
			console.log(msg);
		}
	});

	child.on('stop', function() {
		if(restart) {
			restart = false;
			setTimeout(function() {
				log.info('Starting UpsBoard Back Up.');
				app();
			}, 5000);
		}
	});

	child.start();
}

app();
