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

		initialize: function() {
			this.collection = new Collection();
			this.collection.on('add', this.addVideo, this);
			this.collection.on('remove', this.removeVideo, this);

			var base = this;
			this.collection.fetch();
			App.Funcs.IntervalTimeout(function() {
				base.collection.fetch();
			}, App.Config.UpdateDelay);


			$(window).on('resize', this.resizeImg.bind(this));
			this.slideCounter = 0;
		},

		addVideo: function(video) {
			this.slideCounter += 1;

			var type = video.get('type');
			var thumb = type == 'episode' ? 'tvShowThumb' : 'thumb'
			  , title = type == 'episode' ? 'tvShowTitle' : 'title';

			var img = $('<img />', {src: App.Config.WebRoot + '/api/plex/poster?location=' + encodeURIComponent(video.get(thumb)) + '&width=300&height=500'})
			  , caption = $('<div />', {class: 'carousel-caption'}).html('<h3>' + video.get(title) + '</h3>');

			img.css({width: this.$('.carousel-inner').width() + 'px'});
			video.itemEl = $('<div />', {class: 'item' + ((this.slideCounter == 1) ? ' active' : '')}).append(img).append(caption);
			this.$('.carousel-inner').append(video.itemEl);

			this.resizeImg();

			this.startSlideshow();
		},

		resizeImg: function() {
			this.$('img').css({width: this.$('.carousel-inner').width() + 'px'});
		},

		removeVideo: function(video) {
			video.itemEl.remove();

			this.slideCounter -= 1;
			if(this.slideCounter == 0) {
				this.$('.currentlyWactchingNothing').show();
			} else {
				this.resetCarousel();
			}
		},

		startSlideshow: function() {
			this.$('.currentlyWactchingNothing').hide();
			this.resetCarousel();

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


	App.View.Panel.CurrentlyWatching = View;
})(App, jQuery, _, Backbone);
