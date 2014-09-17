define([
	'backbone', 'moment',
	'tmpl!view/episode-cover',
	'tmpl!popover/upcoming-show',

	'jquery.livestamp'
], function(Backbone, moment, TmplEpisodeCover, TmplPopover) {

	function episodeTime() {

	}

	var View = Backbone.View.extend({
		tagName: 'li',

		initialize: function() {
			var season = this.model.get('season')
			  , epDate = this.model.get('airdate')
			  , epNum = this.model.get('episode')
			  , epName = this.model.get('ep_name')
			  , epPlot = this.model.get('ep_plot')
			  , showName = this.model.get('show_name')
			  , airs = this.model.get('airs')
			  , network = this.model.get('network');

			  epPlot = (epPlot == '') ? 'No episode plot given' : epPlot;
			  airs = (airs) ? airs : '00:00';

			this.$el.data('time', this.model.getTime());

			var epDateMoment = this.model.moment();
			var isEpMissed = moment().isAfter(epDateMoment);

			var showPoster = Config.WebRoot + '/api/sickbeard/poster?showId=' + this.model.get('show_id') + '&width=200';
			var templateObj = {
				epCode: season + 'x' + epNum,
				epPlot: epPlot,
				epTime: airs.toLowerCase(),
				epTitle: epName,
				showName: showName,
				showPoster: showPoster,
				showTimeAndNetwork: airs + ' on ' +  network
			};

			this.$el.html(TmplEpisodeCover(templateObj));

			if(isEpMissed) {
				this.$('.poster').addClass('missing-episode');
			}

			var img = $('<img/>', {src: showPoster}).load(function() {
				this.$('.poster').fadeIn();
			}.bind(this));

			this.$('.poster img').popover({
				html: true,
				content: TmplPopover(templateObj),
				trigger: 'hover',
				placement: 'bottom'
			}).on('shown.bs.popover', function() {
				$(this.$('.episode-airs-moment')).livestamp(epDateMoment);
			}.bind(this)).on('hide.bs.popover', function() {
				$(this.$('.episode-airs-moment')).livestamp('destroy');
			}.bind(this));
		},

		remove: function() {

		},

		render: function() {
			return this.$el;
		}
	});

	return View;
});