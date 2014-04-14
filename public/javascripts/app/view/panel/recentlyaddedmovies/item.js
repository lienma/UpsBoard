define([
	'backbone', 'moment',

	'tmpl!popover/recently-added-movie'
], function(Backbone, moment, TmlpPopover) {

	var View = Backbone.View.extend({
		tagName: 	'div',
		className: 	'item',
		carousel:	null,

		initialize: function(obj, carousel) {

			this.carousel = carousel;
			this._resizeImg = this._resizeImg.bind(this);

			this.buildView();
			this.buildPopover(this.model);
		},

		buildView: function(model) {
			var src = Config.WebRoot + '/api/plex/poster?location=' + encodeURIComponent(this.model.get('movieThumbnail')) + '&width=300&height=500';
			this.img = $('<img />', { 'src': src });
			this.$el.append(this.img);
		},

		buildPopover: function(model) {
			var coverSrc = Config.WebRoot + '/api/plex/poster?location=' + encodeURIComponent(model.get('movieCover'));

			var seconds = Math.floor(parseInt(model.get('movieLength')) / 1000);
			var numHours = Math.floor(seconds / 3600);
			var numMinutes = Math.floor((seconds % 3600) / 60);

			var strHours = ' ' + ((numHours == 1) ? 'Hour' : 'Hours') + ' '
			  , strMinutes = ' ' + ((numMinutes == 1) ? 'Minute' : 'Minutes');
			var length = numHours + strHours + numMinutes + strMinutes;

			var tmplObj = {
				cover: coverSrc,
				length: length,
				rating: model.get('movieRating'),
				released: moment(model.get('movieReleased'), 'YYYY-MM-DD').format('MMMM Do YYYY'),
				summary: model.get('movieSummary'),
				title: model.get('movieTitle'),
				year: model.get('movieYear')
			};

			this.details = $('<div/>').html(TmlpPopover(tmplObj));
			this.$el.append(this.details);

			var holder = $(this.details.find('.carousel-menu-holder'));
			this.$el.hover(function(event) {
				holder.slideDown('fast');
			}, function(event) {
				holder.slideUp('fast');
			});
		},

		resizeImg: function() {
			this._resizeImg();
			$(window).on('resize', this._resizeImg.bind(this));
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