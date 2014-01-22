var _ 	= require('underscore');

var log = require('./../libs/Logger')('API_ROUTE');

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
			var plex = req.app.config.plex;
			plex.getImage({
				location: req.param('location'),
				width: req.param('width'),
				height: req.param('height')
			}).then(function(image) {
				res.type('jpeg');
				res.send(image);
			}).otherwise(function(reason) {
// Show some error?
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
// Show some error?
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
// Show some error?
			});
		}
	},

	sickbeard: {
		poster: function(req, res) {
			var sb = req.app.config.sickbeard;
			sb.getPoster(req.param('showId')).then(function(image) {
				res.type('jpeg');
				res.send(image);
			}).otherwise(function(reason) {
// Error image..
			});
		},
		upcoming: function(req, res) {
			var sb = req.app.config.sickbeard;
			sb.getUpComingShows().then(function(shows) {
				res.json(shows);
			}).otherwise(function(reason) {
// Show some error?
			});
		},
		showsStats: function(req, res) {
			var sb = req.app.config.sickbeard;
			sb.getShowsStats().then(function(stats) {
				res.json({
					percentComplete: Math.round(stats.ep_downloaded / stats.ep_total * 10000) / 100,
					showsActive: stats.shows_active,
					showsTotal: stats.shows_total
				});
			}).otherwise(function(reason) {
// Show some error?
			});
		}
	}
};

exports = module.exports = api;
