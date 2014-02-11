var os 			= require('os')
  , when 		= require('when')
  , _ 			= require('underscore')
  , path 		= require('path');

var appRoot 	= path.resolve(__dirname, '../../')
  , paths 		= require(appRoot + '/core/paths');

var Command 	= require(paths.core + '/command')
  , Service 	= require(paths.core + '/service')
  , log 		= require(paths.logger)('MEMORY');

var idCounter = 0;
var Memory = function(label, options) {
	idCounter += 1;

	this._id = idCounter;

	this.label = label;

	_.defaults((options) ? options : {}, Memory.defaultOptions);
	this.options = options;

	this.default = (this.options.default) ? this.options.default : false;

	this.remote = (this.options.remote) ? true : false;
	
	this.os = (this.remote) ? this.options.remote : os.type().toLowerCase();

	this.service = false;
	if(this.remote) {
		this.service = new Service(this.options.host, this.options.port, {username: this.options.username, password: this.options.password});
	}

	this.command = Command(this.service);
};

Memory.defaultOptions = {
	default: false,
	remote: false,

	os: 'linux',
	host: '',
	port: 22,
	username: '',
	password: ''
};

Memory.prototype.getMemory = function() {
	var self = this, defer = when.defer()
	  , start = new Date().getTime();

	log.debug('Getting memory for', this.label.yellow);

	if(this.os == 'mac') {
		log.debug('UpsBoard currently doesn\'t support getting memory on mac\'s, I\'m working on it :)');

		return when.resolve({
			_id:		self._id,
			label:		self.label,
			default:	self.default,
			free:		0,
			buffer:		0,
			cache:		0,
			used: 		0
		});
	}

	if(this.remote) {
		this.service.isOnline().then(function(isOnline) {
			if(isOnline) {
				cmd();
			} else {
				defer.resolve({
					_id:		self._id,
					label:		self.label,
					default:	self.default,
					offline:	true
				});
			}
		}).otherwise(defer.reject);
	} else {
		cmd();
	}

	function cmd() {
		self.command('free').then(function(result) {
			var lines = result.split('\n');
			var memInfo = lines[1].replace(/[\s\n\r]+/g, ' ');

			memInfo = memInfo.split(' ');

			var data = {
				_id:		self._id,
				label:		self.label,
				default:	self.default,
				total:		parseInt(memInfo[1]) * 1024,
				free:		parseInt(memInfo[3]) * 1024,
				buffer:		parseInt(memInfo[5]) * 1024,
				cache:		parseInt(memInfo[6]) * 1024
			};
	
			data.used = (parseInt(memInfo[2]) * 1024) - data.buffer - data.cache;
	
			defer.resolve(data);
		}).otherwise(defer.reject);
	}

	return defer.promise;
};

exports = module.exports = Memory;
