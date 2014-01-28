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

			var self = this;
			this.collection.fetch();
			App.Funcs.IntervalTimeout(function() {
				self.collection.fetch();
			}, App.Config.UpdateDelayLong);
		},


		addMovie: function(movie) {
			var self = this;
			this.slideCounter += 1;

			var slide = new MovieView({ model: movie });
			slide.setCarousel(this.$('.carousel'));
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
			this.img = $('<img />', { 'src': src });
			this.$el.append(this.img);
		},

		buildPopover: function() {
			var self = this;
			var popoverTemplate = _.template($('#tmpl-panel-recently-added-movie-popover').html());
			var movie = this.model;

			var coverSrc = App.Config.WebRoot + '/api/plex/poster?location=' + encodeURIComponent(movie.get('movieCover'));

			var seconds = Math.floor(parseInt(movie.get('movieLength')) / 1000);
			var numHours = Math.floor(seconds / 3600);
			var numMinutes = Math.floor((seconds % 3600) / 60);

			var strHours = ' ' + ((numHours == 1) ? 'Hour' : 'Hours') + ' '
			  , strMinutes = ' ' + ((numMinutes == 1) ? 'Minute' : 'Minutes');
			var length = numHours + strHours + numMinutes + strMinutes;

			var tmplObj = {
				cover: coverSrc,
				length: length,
				rating: movie.get('movieRating'),
				released: moment(movie.get('movieReleased'), 'YYYY-MM-DD').format('MMMM Do YYYY'),
				summary: movie.get('movieSummary'),
				title: movie.get('movieTitle'),
				year: movie.get('movieYear')
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
