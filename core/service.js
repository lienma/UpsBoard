var fs			= require('fs')
  , Connection	= require('ssh2')
  , when		= require('when')
  , path		= require('path');

var appRoot		= path.resolve(__dirname, '../')
  , paths		= require(appRoot + '/core/paths');

var log			= require(paths.logger)('SERVICE');

var counter = 0;
function Service(host, port, options) {
	var self = this;

	counter += 1;
	this._id = counter;

	var options = (options) ? options : {};

	this.label = (options.label) ? options.label : '';
	this.host = host;
	this.port = port;
	this.url = (options.url) ? options.url : false;
	this.loginRequired = (options.loginRequired) ? options.loginRequired : false;
}

Service.prototype.getHost = function() {
	return this.host;
};

Service.prototype.getPort = function() {
	return this.port;
};

Service.prototype.getID = function() {
	return this._id;
};

Service.prototype.getLabel = function() {
	return this.label;
};

Service.prototype.getURL = function() {
	return this.url;
};

Service.prototype.toString = function() {
	return this.host + ':' + this.port;
};

Service.prototype.isOnline = function(returnSocket) {
	var promise = when.defer()
	  , self = this, isOnline = false
	  , Socket = new require('net').Socket();

	Socket.setTimeout(5000);
	Socket.connect(this.port, this.host);

	Socket.on('connect', function() {
		isOnline = true;
		promise.resolve(true);
		Socket.destroy();
	});

	Socket.on('error', failed);
	Socket.on('timeout', failed);

	return promise.promise;

	function failed() {
		if(!isOnline) {
			promise.resolve(false);
		}
		Socket.destroy()
	}
}

exports = module.exports = Service;
