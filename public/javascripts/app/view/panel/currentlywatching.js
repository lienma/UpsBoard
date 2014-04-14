define([
	'backbone',

	'app/collection/currentlywatching',
	'app/view/panel/currentlywatching/item',
	'app/func/intervaltimeout',

	'bootstrap'
], function(Backbone, Collection, ItemView, Timeout) {

	var View = Backbone.View.extend({
		el: '.currently-watching',

		slideCounter: 0,

		initialize: function() {
			this.collection = new Collection();
			this.collection.on('add', this.addPoster, this);
			this.collection.on('remove', this.removePoster, this);

			this.timeout = Timeout(this.fetch.bind(this), Config.UpdateDelayLong);
			this.timeout.start();

		},

		fetch: function() {
			this.collection.fetch();
		},

		addPoster: function(poster) {
			this.slideCounter += 1;

			poster.view = new ItemView({ model: poster }, this.$('.carousel'));
			poster.view.resizeImg();

			var view = poster.view.render().addClass((this.slideCounter == 1) ? ' active' : '');
			this.$('.carousel-inner').append(view);

			this.startSlideshow();
		},

		startSlideshow: function() {
			this.$('.currentlyWactchingNothing').fadeOut();
			this.resetCarousel();
		},

		removePoster: function(video) {
			video.view.removePoster();

			this.slideCounter -= 1;
			if(this.slideCounter == 0) {
				this.$('.currentlyWactchingNothing').fadeIn();
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

	return View;
});