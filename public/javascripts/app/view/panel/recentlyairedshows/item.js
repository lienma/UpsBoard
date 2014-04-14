define([
	'backbone', 'moment',
	'tmpl!view/recently-aired-show-item',
	'tmpl!popover/recently-aired-show',
	'bootstrap', 'jquery.livestamp'
], function(Backbone, moment, TmplItemView, TmplPopover) {

	var View = Backbone.View.extend({
		tagName: 'li',
		template: TmplItemView,
		initialize: function() {
			this.listenTo(this.model, 'remove', this.removeShow);

			var showPoster = Config.WebRoot + '/api/plex/poster?location=' + encodeURIComponent(this.model.get('tvShowThumbnail')) + '&width=200&height=400'
			  , epPlot = this.model.get('epPlot')
			  , epPoster = Config.WebRoot + '/api/plex/poster?location=' + encodeURIComponent(this.model.get('epThumbnail'))
			  , epAdded = moment.unix(this.model.get('addedAt'));

			var templateObj = {
				epNumber: this.model.get('epNumber'),
				epPlot: (epPlot == '') ? 'No episode plot given' : epPlot,
				epPoster: epPoster,
				epSeason: this.model.get('epSeason'),
				epTitle: this.model.get('epTitle'),
				loggedIn: Config.IsLoggedIn,
				showName: this.model.get('tvShowTitle'),
				showPoster: showPoster,
				watched: (Config.IsLoggedIn) ? this.model.get('watched') : false
			};

			

			this.$el.html(this.template(templateObj));

			var img = $('<img/>', {src: showPoster}).load(function() {
				this.$('.poster').fadeIn();
			}.bind(this));

			this.$('.poster img').popover({
				html: true,
				content: TmplPopover(templateObj),
				trigger: 'hover',
				placement: 'bottom'
			}).on('shown.bs.popover', function() {
				$(this.$('.time-added')).livestamp(epAdded);
			}.bind(this)).on('hide.bs.popover', function() {
				$(this.$('.time-added')).livestamp('destroy');
			}.bind(this));

		},

		removeShow: function() {
			this.$('.poster img').popover('destroy');
			this.remove();
		},

		render: function() {
			return this.$el;
		}
	});

	return View;
});