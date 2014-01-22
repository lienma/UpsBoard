var bcrypt 		= require('bcrypt')
  , fs 			= require('fs')
  , path 		= require('path')
  , when 		= require('when')
  , _ 			= require('underscore');

var appRoot 	= path.resolve(__dirname, '../../../')
  , cachePath 	= path.join(appRoot, 'cache')
  , libsPath 	= path.join(appRoot, 'libs');

var log 		= require(path.join(libsPath, 'Logger'))('CONFIG')
  , Plex 		= require(path.join(libsPath, 'Plex'));

module.exports 	= function validatePlex(data) {
	var promise = when.defer()
	  , plexData = data.data.plex;

	if(!_.isString(plexData.username) || _.isEmpty(plexData.username)) {
		return when.reject(new Error('Plex requires your myPlex username and password'));
	}

	if(!_.isString(plexData.password) || _.isEmpty(plexData.password)) {
		return when.reject(new Error('Plex requires your myPlex username and password'));
	}

	var options = {
		protocol: (_.isString(plexData.protocol)) ? plexData.protocol : 'http://',
		host: (_.isString(plexData.host)) ? plexData.host : 'localhost',
		port: (_.isNumber(plexData.port)) ? plexData.port : 32400,

		username: plexData.username,
		password: plexData.password,

		recentTVSection: (_.isNumber(plexData.recentTVSection)) ? plexData.recentTVSection : -1,
		recentMovieSection: (_.isNumber(plexData.recentMovieSection)) ? plexData.recentMovieSection : -1
	};

	if(_.isString(plexData.url)) {
		options.url = plexData.url;
	} else {
		options.url = options.protocol + options.host + ':' + options.port;
	}
	var plex = new Plex(options);

	function vaidateSection(sectionId, type, err) {
		var promise = when.defer();

		plex.getSectionType(sectionId).then(function(sectionType) {
			if(sectionType == type) {
				promise.resolve();
			} else {
				promise.reject(err);
			}
		}).otherwise(promise.reject);	

		return promise.promise;
	}

	log.debug('Getting plex token for myPlex.');
	plex.getMyPlexToken()

		.then(function() { log.debug('Sending a ping to the plex media server.'); })
		.then(plex.ping.bind(plex))

		.then(function() { log.debug('Checking to see if th tv section id is proper - ' + options.recentTVSection); })
		.then(function() {
			var err = new Error('WRONG_TV_SECTION_ID');
			err.reason = 'The TV section ID is not a tv section.';
			return vaidateSection(options.recentTVSection, 'show', err);
		})

		.then(function() { log.debug('Checking to see if th movie section id is proper - ' + options.recentMovieSection); })
		.then(function() {
			var err = new Error('WRONG_MOVIE_SECTION_ID');
			err.reason = 'The Movie section ID is not a movie section.';
			return vaidateSection(options.recentMovieSection, 'movie', err);
		})

		.then(function() {
			log.info('Validated Plex configuration'.green);
			data.config.plex = plex;
			promise.resolve(data);
		})
	.otherwise(promise.reject);

	var plexCacheFolder = path.join(cachePath, 'plex');
	var cacheFolderExists = fs.existsSync(plexCacheFolder);
	log.debug('Does Plex cache folder exist? ' + cacheFolderExists);

	if(!cacheFolderExists) {
		log.debug('Creating cache folder for Plex.');
		fs.mkdirSync(plexCacheFolder);
	}

	return promise.promise;
};
