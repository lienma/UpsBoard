var colors			= require('colors')
  , forever			= require('forever-monitor')
  , path			= require('path');

var appRoot			= path.resolve(__dirname)
  , paths			= require(appRoot + '/core/paths');

var log				= require(paths.logger)('LAUNCHER');

var restart			= false;
function app() {
	var child = new (forever.Monitor)('upsboard.js', {
		'silent':	true,
		'max':		1,
		//'logFile':	'logs/log.forever',
		//'outFile':	'logs/out.forever',
		//'errFile':	'logs/err.forever'
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
