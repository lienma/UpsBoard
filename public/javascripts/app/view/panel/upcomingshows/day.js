define([
	'jquery', 'backbone', 'moment',

	'tmpl!view/upcoming-shows-day',
	'app/view/panel/upcomingshows/episode',

	'bootstrap'
], function($, Backbone, moment, TmplDay, EpisodeView) {

	var View = Backbone.View.extend({
		tagName: 'tr',

		initialize: function(options) {
			var date = moment(options.date, 'YYYY-MM-DD');

			this.$el.html(TmplDay({
				dateLabel: date.format('dddd')
			}));

			this.$('.date-label').attr('title', date.format('dddd MMMM D, YYYY')).tooltip({placement: 'right'});

			this.listenTo(this.collection, 'add', this.addEpisode);
			this.listenTo(this.collection, 'remove', this.removeEpisode);

			date = options.date.split('-');
			this.$el.data('date', parseInt(date[0] + date[1] + date[2]));
		},

		render: function() {
			return this.$el;
		},

		addEpisode: function(episode) {
			var view = new EpisodeView({model: episode})
			  , render = view.render();

			var list = this.$('.list-episodes')
			  , childern = list.find('li');


			if(childern.length == 0) {
				list.append(render);
			} else {
				for(var i = 0; i < childern.length; i++) {
					var row = $(childern[i]);

					if(render.data('time') < row.data('time')) {
						row.before(render);
						break;
					}

					if(childern.length == i + 1) {
						row.after(render);
					}
				}
			}
		},

		removeEpisode: function(episode) {

		}
	});

	return View;
});