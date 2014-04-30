var request = require('request')
  , when   	= require('when')
  , _ 		= require('underscore')
  , path 	= require('path');

var appRoot = path.resolve(__dirname, '../../')
  , paths 	= require(appRoot + '/core/paths');

var log 	= require(paths.logger)('SABNZBD')

function Sabnzbd(sabConfig) {

	this.url 		= sabConfig.url;
	this.apiKey 	= sabConfig.apiKey;
}

Sabnzbd.prototype.getPage = function(cmd, filters) {
	var defer = when.defer();

	var params = '';
	if(filters) {
		_.each(filters, function(value, key) {
			params += '&' + key + '=' + value;
		});
	}

	var url = this.url + 'api?mode=' + cmd + params + '&output=json&apikey=' + this.apiKey;

	request({
		rejectUnauthorized: false,
		uri: url,
		json: true
	}, function(err, res, body) {
		if(err) {
			var errReject = new Error('SABNZBD_REQUEST');
			errReject.detail = err;
			errReject.url = url;
			errReject.body = body;
			return defer.reject(errReject);
		}
		if(body && _.isObject(body)) {
			if(_.isBoolean(body.status) && !body.status) {
				if(body.error == 'API Key Incorrect') {
					var errReject = new Error('DENIED');
					errReject.detail = body.error;
					errReject.reason = 'The api key for SABnzbd is required or is wrong api key.';
				} else {
					var errReject = new Error('API_ERROR');
					errReject.detail = body.error;
					errReject.body = body;
				}

				return defer.reject(errReject);
			}

			return defer.resolve(body);
		}

		var err = new Error('WRONG_SETTINGS');
		err.reason = 'Something is wrong with the SABnzdb settings.';
		defer.reject(err);
	});

	return defer.promise;
};

Sabnzbd.prototype.changeCategory = function(nzb_id, category) {
	var params = {value: nzb_id, value2: category};

	return this.getPage('change_cat', params);
};

Sabnzbd.prototype.changePriority = function(nzb_id, priority) {
	var numVal = 0, priority = priority.toLowerCase();

	switch(priority) {
		case 'low':
			numVal =  -1;
			break;
		case 'high':
			numVal = 1;
			break;
		case 'force':
			numVal = 2;
			break;
	}

	var params = {value: nzb_id, value2: numVal};
	return this.getPage('priority', params);
};

Sabnzbd.prototype.changeProcessing = function(nzb_id, value) {
	var params = {value: nzb_id, value2: value};
	return this.getPage('change_opts', params);
};

Sabnzbd.prototype.changeScript = function(nzb_id, value) {
	var params = {value: nzb_id, value2: value};
	return this.getPage('change_script', params);
};

Sabnzbd.prototype.getHistory = function(start, limit) {
	return this.getPage('history', {
		start: start,
		limit: limit
	});
};

Sabnzbd.prototype.getQueue = function(start, limit) {
	return this.getPage('queue', {
		start: start,
		limit: limit
	});
};

Sabnzbd.prototype.pauseQueue = function() {
	return this.getPage('pause');
};

Sabnzbd.prototype.queue = function(name, nzb_id, value) {
	var params = {name: name, value: nzb_id};

	if(value) {
		if(name == 'priority') {
			var numVal = 0, priority = value.toLowerCase();
			switch(priority) {
				case 'low':
					numVal =  -1;
					break;
				case 'high':
					numVal = 1;
					break;
				case 'force':
					numVal = 2;
					break;
			}
			params.value2 = numVal;
		} else if(name == 'delete') {

			params.del_files = value;
		} else {
			params.value2 = value;
		}
	}

	return this.getPage('queue', params);
};

Sabnzbd.prototype.moveItem = function(nzb_id, position) {
	var params = {value: nzb_id, value2: position};

	return this.getPage('switch', params);
};

Sabnzbd.prototype.resumeQueue = function() {
	return this.getPage('resume');
};

Sabnzbd.prototype.deleteHistory = function(nzb_id, del_files) {
	var params = {name: 'delete', value: nzb_id, del_files: del_files};
	return this.getPage('history', params);
};


Sabnzbd.prototype.setSpeedLimit = function(speed) {
	if(!_.isNumber(speed) && speed != 0) {
		var err = new Error('INVALID_NUMBER');
		return when.reject(err);
	}

	return this.getPage('config', {'name': 'speedlimit', 'value': speed});
};

Sabnzbd.prototype.ping = function() {
	return this.getPage('qstatus');
};

exports = module.exports = Sabnzbd;
