var request 		= require('request')
  , when 			= require('when')
  , path			= require('path')
  , _				= require('underscore');

var appRoot 		= path.resolve(__dirname, '../../')
  , paths 			= require(appRoot + '/core/paths');

var CPU				= require(paths.stats + '/cpu');

exports.disks = function(req, res) {
	var drives = req.app.config.drives;

	var funcArray = [];
	drives.forEach(function(drive) {
		funcArray.push(drive.getDriveSpace());
	});

	var loggedIn = req.isAuthenticated();

	when.all(funcArray).then(function(results) {
		var used = 0, total = 0;

		results.forEach(function(drive) {
			if(!drive.offline) {
				used += drive.used;
				total += drive.total;

				if(!loggedIn) {
					drive.used = Math.round(drive.used / drive.total * 100)
					drive.total = 100;
				}
			}
		});

		var json = {
			collection: results,

			used: (loggedIn) ? used : Math.round(used / total * 100),
			total: (loggedIn) ? total : 100
		};

		return res.json(json);

	}).otherwise(function(reason) {
console.log('exports.disks:');
console.log(reason);
		return res.json([]);
	});
};

exports.services = function(req, res) {
	var services = req.app.config.services;

	var funcArray = [];
	services.forEach(function(service) {
		funcArray.push(service.isOnline());
	});

	when.all(funcArray).then(function(results) {
		var resServices = [];
		for(var i = 0; i < results.length; i++) {
			var online = results[i]
			  , service = services[i];

			var url = service.getURL();
			if(service.loginRequired) {
				url = (req.isAuthenticated()) ? url : false;
			}

			var json = {
				_id: 		service.getID(),
				label: 		service.getLabel(),
				url: 		url,
				online: 	online,
				status: 	(online) ? 'Online' : 'Offline'
			};
			resServices.push(json);
		}

		return res.json(resServices);
	}).otherwise(function(reason) {
console.log('exports.services:');
console.log(reason);
		return res.json([]);
	});
};


exports.weather = function(req, res) {
	var config = req.app.config.weather;

	var useFahrenheit = (config.useFahrenheit) ? '' : '&units=si'
	  , forecastExcludes = '?exclude=daily,flags' + useFahrenheit
	  , url = 'https://api.forecast.io/forecast/' + config.apiKey;
		url += '/' + config.latitude + ',' + config.longitude + forecastExcludes;

	request({
		uri: url, json: true, timeout: 10000
	}, function(err, resp, body) {

		if(err || !_.isObject(body) || !_.isObject(body.currently)) {
			return res.json({});
		}

		return res.json({
			currentSummary: body.currently.summary,
			currentIcon: body.currently.icon,
			currentTemp: Math.round(body.currently.temperature),
			currentWindSpeed: Math.round(body.currently.windSpeed),
			currentWindBearing: body.currently.windBearing,

			minutelySummary: (body.minutely) ? body.minutely.summary : false,
			hourlySummary: body.hourly.summary,

			useFahrenheit: config.useFahrenheit,

			alerts: (body.alerts) ? body.alerts : []
		});
	});
};

function copyProps(properties, to, from) {
	properties.forEach(function(prop) {
		to[prop] = from[prop];
	});
}



function getMemory(req) {
	var promise = when.defer()
	  , memory = req.app.config.memory
	  , isLoggedIn = req.isAuthenticated();

	var funcArray = [];
	for(var i = 0; i < memory.length; i++) {
		funcArray.push(memory[i].getMemory());
	}

	when.all(funcArray).then(function(results) {
		var json = [];
		results.forEach(function(server) {


			json.push(server);
		});

		return promise.resolve(json);
	}).otherwise(function(reason) {
console.log('getMemory:');
console.log(reason);
		return promise.resolve([]);
	});

	return promise.promise;
}
