define([
	'jquery', 'backbone', 'moment',

	'tmpl!view/upcoming-shows-day',
	'app/view/panel/upcomingshows/episode',

	'bootstrap'
], function($, Backbone, moment, TmplDay, EpisodeView) {

	var View = Backbone.View.extend({
		tagName: 'tr',

		initialize: function(options) {
			var isMissing = options.date == 'missing';

			if(isMissing) {
				this.createMissing(options);
			} else {
				this.createDay(options);
			}

			this.listenTo(this.collection, 'add', this.addEpisode);
			this.listenTo(this.collection, 'remove', this.removeEpisode);

		},

		createDay: function(options) {
			var date = moment(options.date, 'YYYY-MM-DD');

			this.$el.html(TmplDay({
				dateLabel: date.format('dddd')
			}));
			this.$('.date-label').attr('title', date.format('dddd MMMM D, YYYY')).tooltip({placement: 'right'});

			date = options.date.split('-');
			this.$el.data('date', parseInt(date[0] + date[1] + date[2]));
		},

		createMissing: function(options) {
			this.$el.html(TmplDay({
				dateLabel: 'Missing'
			}));

			this.$('.date-label').addClass('missing');
			this.$el.data('date', 0);
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