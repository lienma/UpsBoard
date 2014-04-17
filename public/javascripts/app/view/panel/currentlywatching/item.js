define([
	'backbone',

	'tmpl!popover/currently-watching',
	'app/func/intervaltimeout',
	'app/func/tooltip'
], function(Backbone, TmplPopover, Timeout, Tooltip) {

	function imgPlatform(platform, title) {
		var img = '';
		switch(platform) {
			case 'Roku':
				img = 'roku.png';
				break;
			case 'Apple TV':
				img = 'appletv.png';
				break;
			case 'Firefox':
				img = 'firefox.png';
				break;
			case 'Chromecast':
				img = 'chromecast.png';
				break;
			case 'Chrome':
				img = 'chrome.png';
				break;
			case 'Android':
			case 'Nexus':
				img = 'android.png';
				break;
			case 'iPad':
			case 'iPhone':
			case 'iOS':
				img = 'ios.png';
				break;
			case 'Plex Home Theater':
				img = 'pht.png';
				break;
			case 'Windows-XBMC':
			case 'Linux/RPi-XBMC':
				img = 'xbmc.png';
				break;
			case 'Safari':
				img = 'safari.png';
				break;
			case 'Internet Explorer':
				img = 'ie.png';
				break;
			case 'Unknown Browser':
				img = 'default.png';
				break;

			default:
				if(title == 'Apple') {
					img = 'atv.png';
				} else if(/TV [a-z][a-z]\d\d[a-z]/.test(title)) {
					img = 'samsung.png';
				} else {
					img = 'default.png';
				}
		}

		return img;
	}

	var View = Backbone.View.extend({
		className: 	'item',
		carousel:	null,

		initialize: function(obj, carousel) {
			this.carousel = carousel;
			this.isMovie = this.model.get('type') != 'episode';
			this._resizeImg = this._resizeImg.bind(this);

			this.vidDur = parseInt(this.model.get('duration'));

			this.buildView();
			this.buildPopover();

			this.listenTo(this.model, 'change:viewOffset', function(model) {
				this.startDate = Date.now();
				this.viewOffset = model.get('viewOffset') == '' ? 0 : parseInt(model.get('viewOffset'));
			});

			this.listenTo(this.model, 'change:playingState', function(model) {
				var state = model.get('playingState');
				if(state == 'paused') {
					this.timeout.stop();
					this.$('.offset-time').text('Paused');
				} else if(state == 'playing') {
					this.timeout.start();
				} else {
					this.timeout.stop();
				}
			});
		},

		buildView: function() {
			var poster = this.model;

			var thumb = this.isMovie ? 'thumb' : 'tvShowThumb';
			var src = Config.WebRoot + '/api/plex/poster?location=' + encodeURIComponent(poster.get(thumb)) + '&width=300&height=500';

			this.img = $('<img />', { 'src': src }).addClass('cover');
			this.$el.append(this.img);
		},

		formatDur: function(duration) {
			var duration = parseInt(duration) / 1000;
			var minutes = duration / 60;
			var hours = minutes / 60;

			var durations = [];
			if(parseInt(hours) > 0) {
				durations.push(parseInt(hours) + 'h');
			}
			durations.push(parseInt(minutes % 60) + 'm');
			durations.push(parseInt(duration % 60) + 's');

			return durations.join(' ');
		},

		buildPopover: function() {
			var video = this.model;

			var seconds = Math.floor(parseInt(this.vidDur) / 1000);
			var numHours = Math.floor(seconds / 3600);
			var numMinutes = Math.floor((seconds % 3600) / 60);
			var numSeconds = Math.floor(seconds % 60);

			var strHours = (numHours == 1) ? 'Hour' : 'Hours'
			  , strMinutes = (numMinutes == 1) ? 'Minute' : 'Minutes'
			  , strSeconds = (numSeconds == 1) ? 'Second' : 'Seconds';

			var length = [];
			if(numHours > 0) {
				length.push(numHours, strHours);
			}
			length.push(numMinutes, strMinutes, numSeconds, strSeconds);
			length = length.join(' ');

			var tmplObj = {
				title: this.isMovie ? video.get('title') + ' (' + video.get('year') + ')' : video.get('tvShowTitle'),
				epTitle: !this.isMovie ? video.get('title') : false,

				epNumber: video.get('epNumber') > 9 ? video.get('epNumber') : '0' + video.get('epNumber'),
				seasonNumber: video.get('seasonNumber') > 9 ? video.get('seasonNumber') : '0' + video.get('seasonNumber'),

				vidLength: length,
				duration: this.formatDur(this.vidDur),
				summary: video.get('summary'),

				userAvatar: video.get('userAvatar') ? video.get('userAvatar') : false,
				username: video.get('username'),
				platform: video.get('playerPlatform') == '' ? video.get('player') : video.get('playerPlatform'),
				imgPlatform: imgPlatform(video.get('playerPlatform'), video.get('player')),
			};

			this.details = $('<div/>').html(TmplPopover(tmplObj));
			this.$el.append(this.details);

			this.$('[rel=tooltip]').tooltip();
			this.tooltip = Tooltip({el: this.$('.progress')});

			this.startDate = Date.now();
			this.viewOffset = this.model.get('viewOffset') == '' ? 0 : parseInt(this.model.get('viewOffset'));

			this.timeout = Timeout(this.updateProgress.bind(this), 500, true);

			var holder = $(this.details.find('.carousel-menu-holder'));
			this.$el.hover(function(event) {
				holder.slideDown('fast');
				this.timeout.start();
			}.bind(this), function(event) {
				holder.slideUp('fast');
				this.timeout.stop();
			}.bind(this));
		},

		lastPercent: 0,
		updateProgress: function() {
			var difference = Date.now() - this.startDate;
			var offset = this.viewOffset + difference;
			this.$('.offset-time').text(this.formatDur(offset));

			var percent = parseInt((offset / this.vidDur) * 100) + '%';
			if(this.lastPercent != percent) {
				this.$('.progress-bar').css('width', percent);
				this.tooltip.update(percent + ' Complete');
				this.lastPercent = percent;
			}
		},

		removePoster: function() {
			$(window).off('resize', this._resizeImg);
			this.$el.fadeOut(function() {
				this.remove();
			}.bind(this));
		},

		resizeImg: function() {
			this._resizeImg();
			$(window).on('resize', this._resizeImg);
		},

		_resizeImg: function() {
			this.img.css({width: this.carousel.width() + 'px'});
		},

		render: function() {
			return this.$el;
		}
	});

	return View;
});