var request = require('request');

function Sabnzbd(sabConfig) {
	this.protocol 	= sabConfig.protocol;
	this.host		= sabConfig.host;
	this.port 		= sabConfig.port;
	this.webRoot 	= (sabConfig.webRoot) ? sabConfig.webRoot : '/';
	this.url 		= sabConfig.url;
	this.apiKey 	= sabConfig.apiKey;
}

Sabnzbd.prototype.getPage = function(cmd, filters, callback) {
	if(typeof filters == 'function') {
		var callback = filters;
		filters = '';
	}

	var url = this.url + '/api?mode=' + cmd + '&output=json&apikey=' + this.apiKey;

	request({
		uri: url,
		json: true,
		timeout: 10000
	}, function(err, res, body) {
		if(err) return callback(err);

		if(body) {
			callback(null, body.data);
		}
	});
};

Sabnzbd.prototype.getQueueStatus = function(callback) {
	this.getPage('qstatus', function(err, data) {
console.log('data: ', data);
	});
};

exports = module.exports = Sabnzbd;
