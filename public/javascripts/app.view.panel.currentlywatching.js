!(function(App, $, _, Backbone) {
	var Model = Backbone.Model.extend({
		idAttribute: '_id'
	});

	var Collection = Backbone.Collection.extend({
		model: Model,
		url: App.Config.WebRoot + '/api/plex/currentlyWatching'
	});

	var View = Backbone.View.extend({
		el: 'div.panel.currentlyWatching',

		slideCounter: 0,

		initialize: function() {
			this.collection = new Collection();
			this.collection.on('add', this.addPoster, this);

			var self = this;
			this.collection.fetch();
			App.Funcs.IntervalTimeout(function() {
				self.collection.fetch();
			}, App.Config.UpdateDelayLong);
		},

		addPoster: function(poster) {
			var self = this;
			this.slideCounter += 1;

			var slide = new PosterView({ model: poster });
			slide.setCarousel(this.$('.carousel'));
			slide.resizeImg();

			this.$('.carousel-inner').append(slide.render().addClass((this.slideCounter == 1) ? ' active' : ''));

			this.startSlideshow();
		},

		startSlideshow: function() {
			this.$('.currentlyWactchingNothing').hide();
			this.resetCarousel();
		},

		removeVideo: function(video) {
			video.removePoster();

			this.slideCounter -= 1;
			if(this.slideCounter == 0) {
				this.$('.currentlyWactchingNothing').show();
			} else {
				this.resetCarousel();
			}
		},

		resetCarousel: function() {
			var $carousel = this.$('.carousel')
			  , data = $carousel.data('bs.carousel');

			if(data) {
				var $items = $carousel.find('.item');
				$items.removeClass('active next left right last');
				$($items[0]).addClass('active');
			
				data.$element.off('.' + data.type).removeData('bs.' + data.type);
				$carousel.data('bs.carousel', false);
			}
			$carousel.carousel();
		}
	});

	var PosterView = Backbone.View.extend({
		tagName: 	'div',
		className: 	'item',
		carousel:	null,

		initialize: function() {
			this.isMovie = this.model.get('type') != 'episode';

			this.buildView();
			this.buildPopover();
		},

		buildView: function() {
			var poster = this.model;

			var thumb = this.isMovie ? 'thumb' : 'tvShowThumb';
			var src = App.Config.WebRoot + '/api/plex/poster?location=' + encodeURIComponent(poster.get(thumb)) + '&width=300&height=500';

			this.img = $('<img />', { 'src': src });
			this.$el.append(this.img);
		},

		buildPopover: function() {
			var self = this, video = this.model;
			var popoverTemplate = _.template($('#tmpl-panel-currently-watching-popover').html());

			var tmplObj = {
				loggedIn: App.Config.IsLoggedIn,
				cover: '',
				length: '',
				rating: '',
				released: '',
				summary: '',
				title: this.isMovie ? video.get('title') + ' (' + video.get('year') + ')' : video.get('tvShowTitle'),
				year: ''
			};

			this.details = $('<div/>').html(popoverTemplate(tmplObj));
			this.$el.append(this.details);

			var holder = $(this.details.find('.carousel-menu-holder'));
			this.$el.hover(function(event) {
				holder.slideDown('fast');
			}, function(event) {
				holder.slideUp('fast');
			});
		},

		removePoster: function() {
			$(window).unbind('resize', this._resizeImg.bind(this));
			this.$el.remove();
		},

		setCarousel: function(carousel) {
			this.carousel = carousel;
		},

		resizeImg: function() {
			var self = this;

			this._resizeImg();
			$(window).resize(this._resizeImg.bind(this));
		},

		_resizeImg: function() {
			this.img.css({width: this.carousel.width() + 'px'});
		},

		render: function() {
			return this.$el;
		}
	});

	App.View.Panel.CurrentlyWatching = View;
})(App, jQuery, _, Backbone);
