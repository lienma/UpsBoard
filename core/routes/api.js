var _ 			= require('underscore')
  , path 		= require('path')
  , moment		= require('moment')
  , gm			= require('gm')
  , when		= require('when');

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
					var data = {
						_id: video.sessionKey,
						art: video.art,
						title: video.title,
						titleSort: video.titleSort,
						thumb: video.thumb,
						tvShowTitle: video.tvShowTitle,
						tvShowThumb: video.tvShowThumb,
						year: video.year,
						duration: video.duration,
						epNumber: video.epNumber,
						seasonNumber:video.seasonNumber,
						summary: video.summary,
						type: video.type
					};

					if(req.isAuthenticated()) {
						_.extend(data, {
	 						username: video.username,
							userAvatar: video.userAvatar,
							player: video.player,
							playerPlatform: video.playerPlatform,
							playingState: video.playingState,
							viewOffset: video.viewOffset
						});
					}	

					json.push(data);
				});
				res.json(json);
			}).otherwise(function(reason) {
console.log(reason);
// Show some error?
			});
		},
		poster: function(req, res) {

			if(req.get('If-None-Match')) {
				var lastWeek = moment().subtract('days', 7);
				var isCache = !(moment(new Date(req.get('If-None-Match'))).isBefore(lastWeek));
				log.debug('Is', 'Plex'.cyan, 'image cache in user\'s browser?', (isCache) ? 'Yes'.green : 'No'.red);

				if(isCache) {
					return res.send(304, '');
				}
			}


			function resize(image) {
				var height	= req.param('height') ? req.param('height') : false
				  , width	= req.param('width') ? req.param('width') : false;

				if(height || width) {
					if(req.app._GrapichsMagick) {
						log.debug('Resizing image with sizes:', height, 'x', width);

						var promise	= when.defer();
						gm(image).resize(width, height).toBuffer(function(err, buffer) {
							if(err) {
								return promise.reject(err);
							}
							promise.resolve(buffer);
						});
						return promise.promise;
					}

					log.warn('GraphicsMagick is not enabled, resizing can not be completed. Send full image to user\'s browser');
				}
				return when.resolve(image);
			}

			var plex = req.app.config.plex;
			plex.getImage(req.param('location')).then(resize).then(function(image) {
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
			var plex		= req.app.config.plex
			  , unwatched	= (req.param('unwatched') == 'true' && req.isAuthenticated()) ? true : false
			  , limit		= parseInt((req.param('limit')) ? req.param('limit') : 10);

			plex.getRecentlyAired(plex.recentTVSection, unwatched, 0, limit).then(function(videos) {

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

	sabnzbd: {
		pauseQueue: function(req, res) {
			var sab = req.app.config.sabnzbd;

			if(!req.isAuthenticated()) {
				return res.json({error: 'Permission Denied'});
			}

			if(!sab.enabled) {
				return res.json({error: 'Module Disabled'});
			}

			sab.pauseQueue().then(function(data) {
				res.json(data);
			}).otherwise(function(reason) {
console.log(reason);
			});
		},

		getHistory: function(req, res) {
			var sab = req.app.config.sabnzbd,
			    limit = req.query.limit,
			    start = req.query.start;

			if(!req.isAuthenticated()) {
				return res.json({error: 'Permission Denied'});
			}

			if(!sab.enabled) {
				return res.json({error: 'Module Disabled'});
			}

			sab.getHistory(start, limit).then(function(data) {
				res.json(data.history);
			}).otherwise(function(reason) {
console.log(reason);
			});
		},

		getQueue: function(req, res) {
			var sab = req.app.config.sabnzbd,
			    limit = req.query.limit,
			    start = req.query.start;

			if(!req.isAuthenticated()) {
				return res.json({error: 'Permission Denied'});
			}

			if(!sab.enabled) {
				return res.json({error: 'Module Disabled'});
			}

			sab.getQueue(start, limit).then(function(data) {
				res.json(data.queue);
			}).otherwise(function(reason) {
console.log(reason);
			});
		},

		itemOptions: function(req, res, next) {
			var sab = req.app.config.sabnzbd;

			if(!req.isAuthenticated()) {
				return res.json({error: 'Permission Denied'});
			}

			if(!sab.enabled) {
				return res.json({error: 'Module Disabled'});
			}

			function err(reason) {
console.log(reason);
			}

			function json(data) {
				res.json(data);
			}

			if(req.params.list == 'history' && req.params.func == 'delete') {
				return sab.deleteHistory(req.params.nzb, req.params.value).then(json).otherwise(err);
			}

			if(req.params.list != 'queue') {
				return res.send(404);
			}

			switch(req.params.func) {
				case 'pause':
				case 'resume':
					sab.queue(req.params.func, req.params.nzb).then(json).otherwise(err);
					break;
				case 'move':
					sab.moveItem(req.params.nzb, req.params.value).then(json).otherwise(err);
					break;
				case 'category':
					sab.changeCategory(req.params.nzb, req.params.value).then(json).otherwise(err);
					break;
				case 'priority':
					sab.queue('priority', req.params.nzb, req.params.value.toLowerCase()).then(json).otherwise(err);
					break;
				case 'processing':
					sab.changeProcessing(req.params.nzb, req.params.value).then(json).otherwise(err);
					break;
				case 'script':
					sab.changeScript(req.params.nzb, req.params.value).then(json).otherwise(err);
					break;
				case 'delete':
					sab.queue('delete', req.params.nzb, req.params.value).then(json).otherwise(err);
					break;
				default:
					next();
			}
		},

		resumeQueue: function(req, res) {
			var sab = req.app.config.sabnzbd;

			if(!req.isAuthenticated()) {
				return res.json({error: 'Permission Denied'});
			}

			if(!sab.enabled) {
				return res.json({error: 'Module Disabled'});
			}

			sab.resumeQueue().then(function(data) {
				res.json(data);
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
				var lastWeek = moment().subtract('days', 7);
				var isCache = !(moment(new Date(req.get('If-None-Match'))).isBefore(lastWeek));

				log.debug('Is', 'Sick Beard'.cyan, 'image cache in user\'s browser?', (isCache) ? 'Yes'.green : 'No'.red);

				if(isCache) {
					return res.send(304, '');
				}
			}

			
			sb.getPoster(req.param('showId')).then(resize).then(function(image) {
				res.type('jpeg');

				res.set('Last-Modified', (new Date()).toUTCString());
				res.set('ETag', Date.now());

				res.send(image);
			}).otherwise(function(reason) {
console.log(reason);
			});

			function resize(image) {
				var height	= req.param('height') ? req.param('height') : false
				  , width	= req.param('width') ? req.param('width') : false;

				if(height || width) {
					if(req.app._GrapichsMagick) {
						log.debug('Resizing image to sizes:', height, 'x', width);

						var promise	= when.defer();
						gm(image).resize(width, height).toBuffer(function(err, buffer) {
							if(err) {
								return promise.reject(err);
							}
							promise.resolve(buffer);
						});
						return promise.promise;
					}

					log.warn('GraphicsMagick is not enabled, resizing can not be completed. Send full image to user\'s browser');
				}
				return when.resolve(image);
			}
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
