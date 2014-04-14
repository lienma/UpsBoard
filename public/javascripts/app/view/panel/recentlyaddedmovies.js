define([
	'backbone',

	'app/collection/recentlyaddedmovies',
	'app/view/panel/recentlyaddedmovies/item',
	'app/func/intervaltimeout',

	'bootstrap'
], function(Backbone, Collection, ItemView, Timeout) {

	var View = Backbone.View.extend({
		el: '.recently-added-movies',

		slideCounter: 0,

		initialize: function() {
			this.collection = new Collection();
			this.collection.on('add', this.addMovie, this);


			this.timeout = Timeout(this.fetch.bind(this), Config.UpdateDelayLong);
			this.timeout.start();
		},

		fetch: function() {
			this.collection.fetch();
		},

		addMovie: function(movie) {
			this.slideCounter += 1;

			var slide = new ItemView({ model: movie }, this.$('.carousel'));
			slide.resizeImg();

			this.$('.carousel-inner').append(slide.render().addClass((this.slideCounter == 1) ? ' active' : ''));

			this.startSlideshow();
		},

		startSlideshow: function() {
			if(this.slideCounter == this.collection.size()) {
				this.$('.carousel').carousel();
			}
		}
	});

	return View;
});