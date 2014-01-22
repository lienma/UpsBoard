!(function(App, $, _, Backbone) {
	var Model = Backbone.Model.extend({
		idAttribute: '_id'
	});

	var Collection = Backbone.Collection.extend({
		model: Model,
		url: App.Config.WebRoot + '/api/plex/recentlyAddedMovies'
	});

	var View = Backbone.View.extend({
		el: 'div.panel.recentlyAddedMoviesPanel',

		slideCounter: 0,

		initialize: function() {
			this.collection = new Collection();
			this.collection.on('add', this.addMovie, this);

			var base = this;
			this.collection.fetch();
			App.Funcs.IntervalTimeout(function() {
				base.collection.fetch();
			}, App.Config.UpdateDelayLong);

		},


		addMovie: function(movie) {
			var self = this;
			this.slideCounter += 1;

			var slide = new MovieView({ model: movie });
			slide.setCarousel(this.$('.carousel'));
			slide.resizeImg();

			this.$('.carousel-inner').append(slide.render().addClass((this.slideCounter == 1) ? ' active' : ''));

			//this.startSlideshow();
		},

		startSlideshow: function() {
			if(this.slideCounter == this.collection.size()) {
				this.$('.carousel').carousel();
			}
		}
	});

	var MovieView = Backbone.View.extend({
		tagName: 	'div',
		className: 	'item',
		carousel:	null,

		initialize: function() {

			this.buildView();
			this.buildPopover();
		},

		buildView: function() {
			var movie = this.model;

			var src = App.Config.WebRoot + '/api/plex/poster?location=' + encodeURIComponent(movie.get('movieThumbnail')) + '&width=300&height=500';

			this.img = $('<img />', { 'src': src, title: movie.get('movieTitle') + ' (' + movie.get('movieYear') + ')' });
			//this.caption = $('<div />', {class: 'carousel-caption'}).html('<h3>' + movie.get('movieTitle') + ' <span>(' + movie.get('movieYear') + ')</span></h3>');

			this.$el.append(this.img);
		},

		buildPopover: function() {
			var self = this;
			var popoverTemplate = _.template($('#tmpl-panel-recently-added-movie-popover').html());
			var movie = this.model;

			var coverSrc = App.Config.WebRoot + '/api/plex/poster?location=' + encodeURIComponent(movie.get('movieCover'));


			var tmplObj = {
				cover: coverSrc,
				summary: movie.get('movieSummary'),
				title: movie.get('movieTitle'),
				year: movie.get('movieYear')
			};

			this.details = $('<div/>').html(popoverTemplate(tmplObj));

			this.$el.append(this.details);

			var holder = $(this.details.find('.carousel-menu-holder'));

			this.$el.hover(function(event) {
				//event.stopPropagation();
				holder.slideDown('fast');
			}, function(event) {
				//event.stopPropagation();
				holder.slideUp('fast');
			});
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

	App.View.Panel.RecentlyAddedMovies = View;
})(App, jQuery, _, Backbone);
