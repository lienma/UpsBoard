define([
	'jquery', 'backbone',
	'app/func/intervaltimeout',
	'app/collection/upcomingshows',
	'app/view/panel/upcomingshows/day'
], function($, Backbone, Timeout, UpcomingCollection, DayView) {

	var View = Backbone.View.extend({
		el: '.upcoming-shows',


		initialize: function() {
			this.daysCollection = {};
			this.daysView = {};

			this.collection = new UpcomingCollection();

			this.listenTo(this.collection, 'add', this.processEpisode);

			this.timeout = Timeout(this.fetch.bind(this), Config.UpdateDelayLong);
			this.timeout.start();
		},

		createDayView: function(dateStr) {

			this.daysCollection[dateStr] = new UpcomingCollection();

			var view = new DayView({collection: this.daysCollection[dateStr], date: dateStr})
			  , render = view.render();

			var table = this.$('table.list-days')
			  , childern = table.find('tr');

			if(childern.length == 0) {
				table.append(render);
			} else {
				for(var i = 0; i < childern.length; i++) {
					var row = $(childern[i]);

					if(render.data('date') < row.data('date')) {
						row.before(render);
						break;
					}

					if(childern.length == i + 1) {
						row.after(render);
					}
				}
			}

			this.$('tr').removeClass('alt');
			this.$('tr:odd').addClass('alt');
		},

		fetch: function() {
			return this.collection.fetch();
		},

		processEpisode: function(episode) {

			var dateStr = episode.get('airdate');
			if(!this.daysCollection[dateStr]) {
				this.createDayView(dateStr);
			}

			this.daysCollection[dateStr].add(episode);
		}
	});

	return View;
});