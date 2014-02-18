
var moment 	= require('moment')
  , when 	= require('when')
  , xml2js 	= require('xml2js')
  , path	= require('path');

var appRoot = path.resolve(__dirname, '../../')
  , paths 	= require(appRoot + '/core/paths');

var Command = require(paths.core + '/command')
  , Service = require(paths.core + '/service')
  , common 	= require(paths.core + '/common')
  , log 	= require(paths.logger)('BANDWIDTH');

var globalId = 0;
var Bandwidth = (function() {
	return function(options) {
		var base = this;
		this.id = ++globalId;

		this.label = options.label;
		this.default = (options.default) ? options.default : false;

		this.cap = (options.cap) ? options.cap : false;

		if(options.cap) {
			var cap = options.cap.split(':');
			this.cap = [cap[0].split(','), common.getBytes(cap[1])];
		} else {
			this.cap = false;
		}

		this.interface = (options.interface) ? options.interface : 'eth0';
		this.vnstatPath = (options.vnstatPath) ? options.vnstatPath : 'vnstat';
		this.vnstatDBDirectory = (options.vnstatDBDirectory) ? options.vnstatDBDirectory : false;

		this.max = options.max;

		this.command = Command(options.remote);
	};
})();

Bandwidth.prototype.isDefault = function() {
	return this.default;
};

Bandwidth.prototype.isRemote = function() {
	return this.remote;
};

Bandwidth.prototype.getCap = function() {
	return this.cap;
};

Bandwidth.prototype.getID = function() {
	return this.id;
};

Bandwidth.prototype.getInterface = function() {
	return this.interface;
};

Bandwidth.prototype.getLabel = function() {
	return this.label;
};

Bandwidth.prototype.getMax = function() {
	return this.max;
};

Bandwidth.prototype.getBandwidth = function() {
	var self = this, promise = when.defer();

	log.debug('Getting bandwidth data for', self.label.yellow);

	var waitForData = when.all([this.getLiveBandwidth(), this.getStats()]);
	waitForData.then(function(results) {
		var json = {
			_id: self.getID(),
			label: self.getLabel(),
			default: self.isDefault(),
			max: self.getMax(),

			cap: self.getCap(),

			offline: false,
			dateSince: results[1].dateSince,
			download: results[0].download,
			upload: results[0].upload,

			total: results[1].total,
			lastMonth: results[1].lastMonth,
			thisMonth: results[1].thisMonth,
			today: results[1].today
		};
		promise.resolve(json);
	}).otherwise(function(reason) {
		var json = {
			_id: self.getID(),
			label: self.getLabel(),
			default: self.isDefault(),
			max: self.getMax(),

			cap: self.getCap(),

			err: reason.message,
			offline: true
		};

		switch(reason.message) {
			case 'AUTHENTICATION_FAILED':
				json.detail = 'Username and password failed. Please double check username and password for bandwidth server \'' + self.label + '\'';
				break;

			case 'CONNECTION_FAILED':
			case 'SERVER_OFFLINE':
				json.detail = 'Connection failed. Please double check the settings for bandwidth server \'' + self.label + '\'';
				break;

			case 'CONNECTION_TIMEOUT':
				json.detail = 'Connection timed out to bandwidth server \'' + self.label + '\'';
				break;
		}

		promise.resolve(json);
	});

	return promise.promise;
};

Bandwidth.prototype.getLiveBandwidth = function() {
	var self = this, start = new Date().getTime()
	  , promise = when.defer();

	log.debug('Getting live bandwidth data for', this.label.yellow, 'from', ((this.remote) ? 'remote' : 'local'), 'server.');

	var dirDb = (this.vnstatDBDirectory) ? ' --dbdir ' + this.vnstatDBDirectory : '';
	var cmd = this.vnstatPath + dirDb + ' -i ' + this.interface + ' -tr';
	this.command(cmd).then(process).then(promise.resolve).otherwise(promise.reject);

	return promise.promise;

	function process(stdout) {
		var since = new Date().getTime() - start;

		log.debug('Finished getting live bandwidth for', self.label.yellow + '.', 'Took ' + since + 'ms');

		var fmtStr = stdout.replace(/[\s\n\r]+/g, ' ');

		var download = fmtStr.match(/rx(\s+)((\d+).(\d+)) (\w+)\/s/);
		var upload = fmtStr.match(/tx(\s+)((\d+).(\d+)) (\w+)\/s/);

		var downloadRate = parseFloat(download[2]);
		var uploadRate = parseFloat(upload[2]);

		return {
			download: (download[5] == 'kbit') ? (downloadRate / 1024).toFixed(2) : downloadRate,
			upload: (upload[5] == 'kbit') ? (uploadRate / 1024).toFixed(2) : uploadRate,
		};
	}
};

Bandwidth.prototype.getStats = function() {
	var self = this, start = new Date().getTime()
	  , promise = when.defer();

	var dirDb = (this.vnstatDBDirectory) ? ' --dbdir ' + this.vnstatDBDirectory : '';
	var cmd = this.vnstatPath + dirDb + ' -i ' + this.interface + ' --xml';
	this.command(cmd).then(process).then(promise.resolve).otherwise(promise.reject);

	return promise.promise;

	function process(xml) {
		var processPromise = when.defer()
		  , since = new Date().getTime() - start;

		log.debug('Finished getting history of bandwidth for', self.label.yellow + '.', 'Took ' + since + 'ms');

		var json = {};

		xml = xml.trim();
		if(xml.substr(1,7) == 'vnstat ') {

			var parser = new xml2js.Parser({ mergeAttrs: true });
			parser.parseString(xml, function(err, data) {
				if(err) return callback(err);
				var interface = data.vnstat.interface[0];

				var created = interface.created[0].date[0];
				json.dateSince = moment(created.year[0] + '-' + created.month[0] + '-' + created.day[0]).format('MMMM D, YYYY');

				var traffic = interface.traffic[0];
				var months = traffic.months[0].month;
				var days = traffic.days[0].day;

				function makeArray(ary) {
					var rx = parseInt(ary.rx[0]) * 1024
					  , tx = parseInt(ary.tx[0]) * 1024;
					return [rx, tx, (rx + tx)]
				}

				json.total = makeArray(traffic.total[0]);
				json.thisMonth = makeArray(months[0]);
				json.lastMonth = (months.length > 1) ? makeArray(months[1]) : [0, 0, 0];
				json.today = makeArray(days[0]);

				processPromise.resolve(json);
			});
		} else {
			var err = new Error('NOT_XML');
			if(typeof xml === 'string') {
				err.details = xml
			}
			processPromise.reject(err);
		}

		return processPromise.promise;
	}
};

exports = module.exports = Bandwidth;
