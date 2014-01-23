var fs 		= require('fs')
  , moment 	= require('moment')
  , os 		= require('os')
  , path 	= require('path')
  , when   	= require('when')
  , _    	= require('underscore');

var appRoot = path.resolve(__dirname, '../')
  , paths 	= require(appRoot + '/core/paths');
var config 	= require(paths.app + '/config');

function Logger(module) {
	if(!(this instanceof Logger)) {
		return new Logger(module);
	}

	if(!fs.existsSync(paths.logs)) {
		fs.mkdirSync(paths.logs);
	}

	this.filePath = process.env.DEBUG_PATH || paths.logs + '/debug.log';
	this.module = module;

	var logExists = fs.existsSync(this.filePath);
	if(!logExists) {
		var err = fs.writeFileSync(this.filePath, '',  {mode: 0777} );
	}

	return this;
}

Logger.prototype.printObject = function(obj, baseTabs) {
	var tabs = '', tabCount = 0;
	while(tabCount < baseTabs) {
		tabs += '\t';
		tabCount += 1;
	}

	var printVars = [];
	for(var objVarible in obj) {
		if(obj.hasOwnProperty(objVarible)) {
			var objVar = (objVarible == 'password') ? '*********' : obj[objVarible];

			var strTypeOpen = strTypeClose = '';
			if(_.isString(objVar)) {
				strTypeOpen = strTypeClose = "'";
			}
			if(_.isArray(objVar)) {
				strTypeOpen = '[';
				strTypeClose = ']';
			}

			printVars.push(tabs + '\t"' + objVarible + '": ' + strTypeOpen + objVar + strTypeClose);
		}
	}

	return printVars.join(',\n');
};

Logger.prototype.setModule = function(module) {
	this.module = module.toUpperCase();

	return this;
};

function getMessage(messages) {
	for(var i = 0; i < messages.length; i++) {
		if(!(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/.test(messages[i]))) {
			messages[i] = messages[i].grey;
		}
	}
	return Array.prototype.join.call(messages, ' ');
}
 
Logger.prototype.debug = function() {
	var msg = getMessage(arguments);
	this.log('DEBUG', getMessage(arguments));
};

Logger.prototype.error = function() {
	var msg = Array.prototype.join.call(arguments, ' ');
	this.log('ERROR', getMessage(arguments));
};

Logger.prototype.fatal = function() {
	var msg = Array.prototype.join.call(arguments, ' ');
	this.log('FATAL', getMessage(arguments));
};

Logger.prototype.info = function() {
	var msg = Array.prototype.join.call(arguments, ' ');
	this.log('INFO', getMessage(arguments));
};

Logger.prototype.log = function(type, message) {
	if(type == 'DEBUG' && config.runningMode != 'debug') {
		return;
	}

	var time = moment().format('YYYY-MM-DD HH:mm:SSS');

	var totalSpaces = 8 - type.length;
	var spaces = '';
	while(spaces.length < totalSpaces) {
		spaces = spaces + ' ';
	}

	var logMessage = [time.cyan,
		type[(type == 'DEBUG') ? 'grey' : (type == 'ERROR' || type == 'FATAL') ? 'red' : (type == 'INFO') ? 'green' :'white'] + spaces,
		this.module.blue,
		'::'.cyan,
		message
	].join(' ');

	if(config.runningMode == 'debug') {
		console.log(logMessage);
	}

	logMessage = logMessage.replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '');
	fs.appendFileSync(this.filePath, logMessage + '\n');
};

exports = module.exports = Logger;