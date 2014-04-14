define([
	'backbone',

	'tmpl!popover/currently-watching'
], function(Backbone, TmplPopover) {

	var View = Backbone.View.extend({
		tagName: 	'div',
		className: 	'item',
		carousel:	null,

		initialize: function(obj, carousel) {
			this.carousel = carousel;
			this.isMovie = this.model.get('type') != 'episode';
			this._resizeImg = this._resizeImg.bind(this);

			this.buildView();
			this.buildPopover();
		},

		buildView: function() {
			var poster = this.model;

			var thumb = this.isMovie ? 'thumb' : 'tvShowThumb';
			var src = Config.WebRoot + '/api/plex/poster?location=' + encodeURIComponent(poster.get(thumb)) + '&width=300&height=500';

			this.img = $('<img />', { 'src': src });
			this.$el.append(this.img);
		},

		buildPopover: function() {
			var video = this.model;

			var tmplObj = {
				loggedIn: Config.IsLoggedIn,
				cover: '',
				length: '',
				rating: '',
				released: '',
				summary: '',
				title: this.isMovie ? video.get('title') + ' (' + video.get('year') + ')' : video.get('tvShowTitle'),
				year: ''
			};

			this.details = $('<div/>').html(TmplPopover(tmplObj));
			this.$el.append(this.details);

			var holder = $(this.details.find('.carousel-menu-holder'));
			this.$el.hover(function(event) {
				holder.slideDown('fast');
			}, function(event) {
				holder.slideUp('fast');
			});
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