var _ 			= require('underscore')
  , path 		= require('path')
  , moment		= require('moment');

var appRoot 	= path.resolve(__dirname, '../../')
  , paths 		= require(appRoot + '/core/paths')
  , log 		= require(paths.logger)('API_ROUTE');

var api = {
	plex: {
		currentlyWatching: function(req, res) {
			log.debug('Checking to see if anyone is watching anything on plex');

			var plex = req.app.config.plex;
			plex.getCurrentlyWatching().then(function(videos) {
				log.debug('Successfully got current watching videos from plex');

				var json = [];
				videos.forEach(function(video) {
					json.push({
						_id: video.sessionKey,
						art: video.art,
						title: video.title,
						titleSort: video.titleSort,
						thumb: video.thumb,
						tvShowTitle: video.tvShowTitle,
						tvShowThumb: video.tvShowThumb,
						year: video.year,
						duration: video.duration,
						summary: video.summary,
						type: video.type,
					});
				});
				res.json(json);
			}).otherwise(function(reason) {
log.error
// Show some error?
			});
		},
		poster: function(req, res) {

			if(req.get('If-None-Match')) {
				var isCache = !(moment(req.get('If-None-Match')).isBefore(moment().subtract('days', 7)));
				log.debug('Is', 'Plex'.cyan, 'image cache in user\'s browser?', (isCache) ? 'Yes'.green : 'No'.red);

				if(isCache) {
					return res.send(304, '');
				}
			}

			var plex = req.app.config.plex;
			plex.getImage({
				location: req.param('location'),
				width: req.param('width'),
				height: req.param('height')
			}).then(function(image) {
				res.type('jpeg');

				res.set('Last-Modified', (new Date()).toUTCString());
				res.set('ETag', Date.now());

				res.send(image);
			}).otherwise(function(reason) {
console.log(reason);
			});
		},
		recentlyAddedMovies: function(req, res) {
			var plex = req.app.config.plex;
			plex.getRecentlyAddedMovies(plex.recentMovieSection, 0, 20).then(function(videos) {
				var json = [];
				videos.forEach(function(video) {
					json.push((req.isAuthenticated()) ? video : _.omit(video, 'watched'));	
				});

				res.json(json);
			}).otherwise(function(reason) {
console.log(reason);
			});
		},

		recentlyAired: function(req, res) {
			var plex 		= req.app.config.plex
			  , unwatched 	= (req.param('unwatched') == 'true' && req.isAuthenticated()) ? true : false;

			plex.getRecentlyAired(plex.recentTVSection, unwatched, 0, 18).then(function(videos) {

				var json = [];
				videos.forEach(function(video) {
					json.push((req.isAuthenticated()) ? video : _.omit(video, 'watched'));	
				});

				res.json(json);
			}).otherwise(function(reason) {
console.log(reason);
			});
		}
	},

	sickbeard: {
		poster: function(req, res) {
			var sb = req.app.config.sickbeard;

			if(!sb.enabled) {
				return res.json({disabled: true});
			}

			if(req.get('If-None-Match')) {
				var isCache = !(moment(req.get('If-None-Match')).isBefore(moment().subtract('days', 7)));
				log.debug('Is', 'Sick Beard'.cyan, 'image cache in user\'s browser?', (isCache) ? 'Yes'.green : 'No'.red);

				if(isCache) {
					return res.send(304, '');
				}
			}

			
			sb.getPoster(req.param('showId'), {
				width: req.param('width'),
				height: req.param('height')
			}).then(function(image) {
				res.type('jpeg');

				res.set('Last-Modified', (new Date()).toUTCString());
				res.set('ETag', Date.now());

				res.send(image);
			}).otherwise(function(reason) {
console.log(reason);
			});
		},
		upcoming: function(req, res) {
			var sb = req.app.config.sickbeard;

			if(!sb.enabled) {
				return res.json({disabled: true});
			}

			sb.getUpComingShows().then(function(shows) {
				res.json(shows);
			}).otherwise(function(reason) {
console.log(reason);
			});
		},
		showsStats: function(req, res) {
			var sb = req.app.config.sickbeard;

			if(!sb.enabled) {
				return res.json({disabled: true});
			}

			sb.getShowsStats().then(function(stats) {
				var json = {
					percentComplete: Math.round(stats.ep_downloaded / stats.ep_total * 10000) / 100
				};

				if(req.isAuthenticated()) {
					json.epDownloaded 	= stats.ep_downloaded;
					json.epTotal 		= stats.ep_total;
					json.showsActive	= stats.shows_active;
					json.showsTotal 	= stats.shows_total;
				}

				res.json(json);
			}).otherwise(function(reason) {
console.log(reason);
			});
		}
	}
};

exports = module.exports = api;
