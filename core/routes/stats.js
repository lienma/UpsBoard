var request 		= require('request')
  , when 			= require('when')
  , path			= require('path');

var appRoot 		= path.resolve(__dirname, '../../')
  , paths 			= require(appRoot + '/core/paths');

var CPU				= require(paths.stats + '/cpu');

exports.all = function(req, res) {

	when.all([getCpu(req), getBandwidth(req), getMemory(req)]).then(function(data) {
		res.json({ Cpu: data[0], Bandwidth: data[1], Memory: data[2] });
	});
};

exports.bandwidth = function(req, res) {
	getBandwidth(req).then(function(data) {
		res.json(data);
	}).otherwise(function(err) {
console.log(err);
	});
};

exports.cpu = function(req, res) {
	getCpu(req).then(function(data) {
		res.json(data);
	}).otherwise(function(err) {
console.log(err);
	});
};

exports.memory = function(req, res) {
	getMemory(req).then(function(data) {
		res.json(data);
	}).otherwise(function(err) {
console.log(err);
	});
};

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

		res.json(json);

	}).otherwise(function(reason) {
		res.json([]);
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

		res.json(resServices);
	}).otherwise(function(reason) {
		res.json([]);
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
		if(err || !body || !body.currently) {
			res.json({});
		}

		res.json({
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

function getBandwidth(req) {
	var promise = when.defer()
	  , bw = req.app.config.bandwidth
	  , isLoggedIn = req.isAuthenticated();

	var funcArray = [];
	for(var i = 0; i < bw.length; i++) {
		funcArray.push(bw[i].getBandwidth());
	}

	when.all(funcArray).then(function(results) {
		var json = [];
		results.forEach(function(server) {
			var data = {};
			copyProps(['_id', 'label', 'default', 'max', 'offline', 'dateSince', 'download', 'upload'], data, server);

			if(server.cap) {
				var action = server.cap[0], limit = server.cap[1];
				var total = 0;
				if(action.indexOf('Download') != -1) {
					total += parseInt(server.thisMonth[0]);
				}

				if(action.indexOf('Upload') != -1) {
					total += parseInt(server.thisMonth[1]);
				}

				data.cap = (isLoggedIn) ? total : Math.round(total / limit * 100);;
				data.capLimit = (isLoggedIn) ? limit : 100;
			} else {
				data.cap = false;
			}

			if(isLoggedIn) {
				copyProps(['total', 'lastMonth', 'thisMonth', 'today'], data, server);
			}

			json.push(data);
		});

		promise.resolve(json);
	}).otherwise(function(reason) {
console.log(reason);
		promise.resolve([]);
	});

	return promise.promise;
}

function getCpu() {
	var promise 	= when.defer()

	CPU().then(function(data) {
		promise.resolve(data);
	});

	return promise.promise;
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
			if(!isLoggedIn) {
				server = {
					_id:		server._id,
					label:		server.label,
					default:	server.default,
					offline:	(server.offline) ? true : false,
					free:		Math.round(server.free / server.total * 100),
					buffer:		Math.round(server.buffer / server.total * 100),
					cache:		Math.round(server.cache / server.total * 100),
					used: 		Math.round(server.used / server.total * 100)
				};	
			}

			json.push(server);
		});

		promise.resolve(json);
	}).otherwise(function(reason) {
console.log(reason);
		promise.resolve([]);
	});

	return promise.promise;
}
