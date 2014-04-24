var request	= require('request')
  , path	= require('path')
  , crypto	= require('crypto')
  , xml2js	= require('xml2js')
  , when  	= require('when')
  , os		= require('os')
  , _		= require('underscore')
  , gm		= require('gm');


var appRoot	= path.resolve(__dirname, '../../')
  , paths	= require(appRoot + '/core/paths')
  , pjson	= require(paths.app + '/package.json');

var log		= require(paths.logger)('PLEX')
  , Cache	= require('./../cache')('plex');

function Plex(plexConfig) {
	this.protocol 			= plexConfig.protocol;
	this.host 				= plexConfig.host;
	this.port 				= plexConfig.port;
	this.username 			= plexConfig.username;
	this.password 			= plexConfig.password;
	this.url 				= plexConfig.url;
	this.recentTVSection 	= plexConfig.recentTVSection;
	this.recentMovieSection = plexConfig.recentMovieSection;
}

Plex.prototype.getBaseUri = function() {
	return this.protocol + this.host + ':' + this.port;
};

Plex.prototype.getMyPlexToken = function() {
	var promise = when.defer()
	  , self = this
	  , headers = { 		
		'X-Plex-Platform': os.type(),
		'X-Plex-Platform-Version': os.release(),
		'X-Plex-Device': 'UpsBoard (' + os.type() + ')',
		'X-Plex-Product': 'UpsBoard',
		'X-Plex-Version': pjson.version,
		'X-Plex-Client-Identifier': 'UpsBoard @ ' + os.hostname() 
	};

	request.post('https://my.plexapp.com/users/sign_in.xml', { headers: headers }, function(err, res, body) {
		if(err) return promise.reject(err);

		if(body.substr(0, 5) != '<?xml') { //>
			var err = new Error('Error gettin plex token; Response not xml format.');
			if(typeof body === 'string') {
				err.details = body
			}
			promise.reject(err);
		}

		var parser = new xml2js.Parser({ mergeAttrs: true });
		parser.parseString(body, function(err, data) {
			if(err) return promise.reject(err);

			if(data.errors) return promise.reject(new Error('Plex Error: ' + data.errors.error[0]));

			self.token = data.user.authenticationToken[0];

			promise.resolve();
		});
	}).auth(this.username, this.password);

	return promise.promise;
};

Plex.prototype.getPage = function(url, options) {
	var self = this
	  , promise = when.defer()
	  , tokenCount = 0;

	var urlOptions = '';
	if(typeof options === 'object') {
		for(x in options) {
			url += (url.indexOf('?') == -1) ? '?' : '&';
			url += x + '=' + options[x];
		}	
	}

	var resOptions = {
		rejectUnauthorized: false,
		uri: this.url + url,
		headers: { 'X-Plex-Token': this.token },
		encoding: null
	};

	function callback(err, res, body) {
		if(err) {
			var errReject = new Error('REQUEST');
			errReject.detail = err;
			return promise.reject(errReject);
		}

		if(res.statusCode == 401) {
			if(tokenCount == 1) {
				var err = new Error('UNAUTHORIZED');
				err.reason = 'Plex token bad?';
				return promise.reject(err);
			} else {
				self.getMyPlexToken().then(function() {
					tokenCount += 1;
					request(resOptions, callback);

				}).otherwise(function(reason) {
					var err = new Error('UNAUTHORIZED');
					err.reason = reason;
					return promise.reject(err);
				});
			}
		}

		if(res.statusCode == 404) {
			var err = new Error('404_FILE_NOT_FOUND');
			err.reason = '404 - ' + resOptions.uri;
			return promise.reject(err);
		}

		promise.resolve(body);
	}

	request(resOptions, callback);

	return promise.promise;
};

Plex.prototype.getXml = function(url) {
	var promise = when.defer();

	this.getPage(url).then(function(body) {
		body = (body.toString('utf-8')).trim();

		if(body.substr(0, 5) != '<?xml') { //>
			var err = new Error('NOT_XML');
			err.url = url;
			if(typeof body === 'string') {
				err.details = body
			}
			promise.reject(err);
		}

		return when.resolve(body);
	}).then(function(body) {

		var parser = new xml2js.Parser({ mergeAttrs: true });
		parser.parseString(body, function(err, data) {
			if(err) {
				var errParse = new Error('PARSE_ERROR');
				errParse.err = err;
				return promise.reject(errParse);
			}

			promise.resolve(data);
		});
	}).otherwise(promise.reject);

	return promise.promise;
};

Plex.prototype.getCurrentlyWatching = function() {
	var promise = when.defer();

	var url = '/status/sessions';
	this.getXml(url).then(function(data) {
		log.debug('Finished getting xml from Plex, now processing data');

		if(!data.MediaContainer) {
			var err = new Error('INVALID_RESPONSE');
			err.err = data;
			return promise.reject(err);
		}

		if(data.MediaContainer.size == 0) {
			log.debug('There is no one watching anything. Returning an empty array.');
			return promise.resolve([]);
		}

		var json = [];
		data.MediaContainer.Video.forEach(function(video) {
			var User = get(video, 'User')
			  , Player = get(video, 'Player');


			json.push({
				sessionKey: 	get(video, 'sessionKey'),
				art: 			get(video, 'art'),
				title: 			get(video, 'title'),
				titleSort: 		get(video, 'titleSort'),
				thumb: 			get(video, 'thumb'),
				tvShowTitle: 	get(video, 'grandparentTitle'),
				tvShowThumb: 	get(video, 'grandparentThumb'), 
				year: 			get(video, 'year'),
				duration: 		get(video, 'duration'),
				summary: 		get(video, 'summary'),
				epNumber:		get(video, 'index'),
				seasonNumber:	get(video, 'parentIndex'),
				viewOffset: 	get(video, 'viewOffset'),
				type: 			get(video, 'type'),
				username: 		get(User, 'title'),
				userAvatar: 	get(User, 'thumb'),
				player: 		get(Player, 'title'),
				playerPlatform: get(Player, 'platform'),
				playingState: 	get(Player, 'state')
			});
		});
		promise.resolve(json);
	}).otherwise(promise.reject);

	return promise.promise;
};

Plex.prototype.getImage = function(options) {
	var promise = when.defer()
	  , imgOptions = {}
	  , fileCacheName = '';

	var url		= options.location
	  , height	= (options.height) ? options.height : false
	  , width	= (options.width) ? options.width : false;

	if((url.indexOf('/library/metadata/') != 0)) {
		var err = new Error('INVALID_LOCATION');
		err.detail = 'Invalid image location for plex';

		return promise.reject('Invalid Location');
	}

	var self = this
	  , hash = crypto.createHash('md5').update(url).digest('hex');

	function getImage() {
		var defer = when.defer();
		self.getPage(url).then(defer.resolve).otherwise(defer.reject);
		return defer.promise;
	}

	Cache.getItem('img-' + hash, getImage).then(function(image) {
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

Plex.prototype.getRecentlyAddedMovies = function(sectionId, start, size) {
	var promise = when.defer()
	  , testStart = isNaN(start)
	  , testSize = isNaN(size);

	if(testStart || testSize) {
		var err = new Error('INVALID_OPTIONS');
		err.detail = 'Invalid options for getting recently added items';
		return promise.reject(err);
	}

	var url = '/library/sections/' + sectionId + '/all?sort=addedAt:desc&X-Plex-Container-Start=' + start + '&X-Plex-Container-Size=' + size;
	this.getXml(url).then(function(data) {
		var videos = [];
		if(data.MediaContainer && data.MediaContainer.size > 0) {

			data.MediaContainer.Video.forEach(function(video) {

				var rating = parseFloat(get(video, 'rating'));
				rating = Math.round(rating * 10) / 10;

				videos.push({
					_id: 			parseInt(get(video, 'ratingKey')),
					movieTitle: 	get(video, 'title'),
					movieSummary: 	get(video, 'summary'),
					movieYear: 		parseInt(get(video, 'year')),
					movieStudio: 	get(video, 'studio'),
					movieRating: 	rating,
					movieThumbnail: get(video, 'thumb'),
					movieCover: 	get(video, 'art'),
					movieLength: 	parseInt(get(video, 'duration')),
					movieReleased: 	get(video, 'originallyAvailableAt'),
					addedAt: 		parseInt(get(video, 'addedAt')),
					updatedAt: 		parseInt(get(video, 'updatedAt')),
					movieGenre: 	tags(video.Genre),
					movieWriter: 	tags(video.Writer),
					movieDirector: 	tags(video.Director),
					movieCountry: 	tags(video.Country),
					movieRole: 		tags(video.Role),
					watched: 		(video.viewCount) ? true : false
				});
			});
		}

		return promise.resolve(videos);
	}).otherwise(promise.reject);

	return promise.promise;
};

Plex.prototype.getRecentlyAired = function(sectionId, unwatched, start, size) {
	var promise = when.defer()
	  , testStart = isNaN(start)
	  , testSize = isNaN(size);

	if(testStart || testSize) {
		var err = new Error('INVALID_OPTIONS');
		err.detail = 'Invalid options for getting recently aired items';
		return promise.reject(err);
	}

	var urlUnwatched = (unwatched) ? '&unwatched=1' : '';
	var url ='/library/sections/' + sectionId + '/all?type=4&sort=originallyAvailableAt:desc' + urlUnwatched + '&X-Plex-Container-Start=' + start + '&X-Plex-Container-Size=' + size;

	this.getXml(url).then(function(data) {
		var videos = [];
		if(data.MediaContainer && data.MediaContainer.size > 0) {

			data.MediaContainer.Video.forEach(function(video) {

				videos.push({
					_id: 				parseInt(get(video, 'ratingKey')),
					tvShowKey: 			parseInt(get(video, 'grandparentRatingKey')),
					seasonKey: 			parseInt(get(video, 'parentRatingKey')),
					tvShowTitle: 		get(video, 'grandparentTitle'),
					tvShowContentRating: get(video, 'contentRating'),
					epThumbnail: 		get(video, 'thumb'),
					seasonThumbnail: 	get(video, 'parentThumb'),
					tvShowThumbnail: 	get(video, 'grandparentThumb'),
					epTitle: 			get(video, 'title'),
					epPlot: 			get(video, 'summary'),
					epYear:				parseInt(get(video, 'year')),
					epNumber: 			parseInt(get(video, 'index')),
					epSeason: 			parseInt(get(video, 'parentIndex')),
					epDuration: 		parseInt(get(video, 'duration')),
					epAired: 			get(video, 'originallyAvailableAt'),
					addedAt: 			parseInt(get(video, 'addedAt')),
					epWriter:			tags(video.Writer),
					epDirector:			tags(video.Director),
					watched: 			(video.viewCount) ? true : false
				});
			});
		}
		promise.resolve(videos);
	}).otherwise(promise.reject);

	return promise.promise;
};

Plex.prototype.getSectionType = function(sectionId) {
	var promise = when.defer();

	var url = '/library/sections/' + sectionId + '/all?X-Plex-Container-Size=1&X-Plex-Container-Start=0';
	this.getXml(url).then(function(data) {
		if(err) return promise.reject(err)

		if(data.MediaContainer) {
			return promise.resolve(data.MediaContainer.viewGroup);
		}

		var err = new Error();
		promise.reject(err);
	}).otherwise(promise.reject);

	return promise.promise;
};

Plex.prototype.ping = function() {
	var promise = when.defer();

	this.getXml('/status').then(function(data) {

		if(data.MediaContainer) return promise.resolve();

		var err = new Error('WRONG_SETTINGS');
		err.reason = 'Something wrong with the Plex settings.';
		promise.reject(err);
	}).otherwise(promise.reject);

	return promise.promise;
};


function get(obj, key) {

	if(obj[key]) {
		if(_.isArray(obj[key])) {
			return obj[key][0];
		}

		return obj[key];
	}

	return '';
}

function tags(obj) {
	if(!obj) {
		return [];
	}

	var Tags = [];
	obj.forEach(function(tag) {
		Tags.push(get(tag, 'tag'));
	});

	return Tags;
}

exports = module.exports = Plex;
