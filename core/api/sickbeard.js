var request = require('request')
  , gm		= require('gm')
  , when   	= require('when')
  , _ 		= require('underscore')
  , path 	= require('path');

var appRoot = path.resolve(__dirname, '../../')
  , paths 	= require(appRoot + '/core/paths');

var log 	= require(paths.logger)('SICKBEARD')
  , Cache	= require('./../cache')('sickbeard');

function formatShow(show) {
	return {
		_id: show.tvdbid,
		airdate: show.airdate,
		airs: show.airs,
		ep_name: show.ep_name,
		ep_plot: show.ep_plot,
		episode: show.episode,
		network: show.network,
		season: show.season,
		show_name: show.show_name,
		weekday: show.weekday
	};
}

function SickBeard(sbConfig) {
	this.protocol 	= sbConfig.protocol;
	this.host		= sbConfig.host;
	this.port 		= sbConfig.port;
	this.webRoot 	= sbConfig.webRoot;
	this.url 		= sbConfig.url;
	this.apiKey 	= sbConfig.apiKey;
}

SickBeard.prototype.getBaseUrl = function() {
	return this.protocol + this.host + ':' + this.port + this.webRoot;
};

SickBeard.prototype.getPage = function(cmd, filters) {
	var promise = when.defer();

	var filters = (filters) ? filters : '';
	var url = this.url + '/api/' + this.apiKey + '/?cmd=' + cmd + '&' + filters;

	request({
		uri: url,
		json: true,
		timeout: 10000
	}, function(err, res, body) {
		if(err) {
			var errReject = new Error('REQUEST');
			errReject.detail = err;
			return promise.reject(errReject);
		}

		if(body && _.isObject(body)) {
			if(body.result == 'success') {
				return promise.resolve(body.data);
			}

			var err = new Error((body.result == 'denied') ? 'DENIED' : 'FAILED');
			err.detail = body.message;

			if(body.result == 'denied') {
				err.reason = 'The api key for Sick Beard is wrong';
			}
			return promise.reject(err);
		}

		var err = new Error('WRONG_SETTINGS');
		err.reason = 'Something wrong with the Sick Beard settings.';
		promise.reject(err);
	});

	return promise.promise;
};

SickBeard.prototype.getShowsStats = function(callback) {
	var promise = when.defer();
	this.getPage('shows.stats').then(promise.resolve).otherwise(promise.reject);
	return promise.promise;
};

SickBeard.prototype.getPoster = function(showId, options) {
	var promise = when.defer();
	var self = this;

	var width = (options.width) ? options.width : false
	  , height = (options.height) ? options.height : false;
	
	var url = this.url + '/api/' + this.apiKey + '/?cmd=show.getposter&tvdbid=' + showId;

	function getImage(dontWriteImage) {
		var defer = when.defer();

		request({uri: url, timeout: 10000, encoding: null}, function(err, res, body) {
			if (!err && res.statusCode == 200) {
				defer.resolve(body);
			} else {
				promise.reject(err);
			}
		});

		return defer.promise;
	}

	Cache.getItem('poster-' + showId, getImage).then(function(image) {
		if(height || width) {
			resizeImage(image);
		} else {
			promise.resolve(image);
		}
	});

	function resizeImage(image) {
		gm(image).resize(width, height).toBuffer(function(err, buffer) {
			if(err) {
				return promise.reject(err);
			}
			promise.resolve(buffer);
		});
	}

	return promise.promise;
};

SickBeard.prototype.getUpComingShows = function(type) {
	var promise = when.defer();

	var type = (type) ? type : 'missed|today|soon|later';

	this.getPage('future', 'sort=date&type=' + type).then(function(data) {
		var json = [];
		if(data.missed)
			for(var i = 0; i < data.missed.length; i++)
				json.push(formatShow(data.missed[i]));

		if(data.today)
			for(var i = 0; i < data.today.length; i++)
				json.push(formatShow(data.today[i]));

		if(data.soon)
			for(var i = 0; i < data.soon.length; i++)
				json.push(formatShow(data.soon[i]));

		if(data.later)
			for(var i = 0; i < data.later.length; i++)
				json.push(formatShow(data.later[i]));

//console.log(data.today);

		promise.resolve(json);
	}).otherwise(promise.reject);

	return promise.promise;
};

SickBeard.prototype.ping = function() {
	var promise = when.defer();
	this.getPage('sb.ping').then(function() {
		promise.resolve();
	}).otherwise(promise.reject);
	return promise.promise;
};

exports = module.exports = SickBeard;
