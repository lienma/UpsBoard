!(function(App, $, _, Backbone, moment) {
	var EpisodeModel = Backbone.Model.extend({
		idAttribute: '_id'
	});

	var AllCollection = Backbone.Collection.extend({
		model: EpisodeModel,
		url: App.Config.WebRoot + '/api/sickbeard/upcoming'
	});

	var DayCollection = Backbone.Collection.extend({
		model: EpisodeModel,
	});

	var View = Backbone.View.extend({
		el: 'div.panel.upComingShows',

		initialize: function() {
			this.collection = new AllCollection();
			this.collection.on('add', this.processEpisode, this);

			this.collection.fetch();
			App.Funcs.IntervalTimeout(function() {
				this.collection.fetch();
			}.bind(this), App.Config.UpdateDelayLong);
		},


		daysCollection: {},
		daysView: {},
		processEpisode: function(episode) {


			var date = episode.get('airdate');
			if(this.daysCollection[date]) {
				this.daysCollection[date].add(episode);
			} else {

				var collection = new DayCollection();
				collection.add(episode);

				this.daysCollection[date] = collection;

				this.processView(collection, episode);
			}

		},

		processView: function(collection, episode) {
			var view = new DayView({collection: collection});
			var date = episode.get('airdate');

			date = date.split('-');
			date = parseInt(date[0] + date[1] + date[2]);


			var table = this.$('table.list-days');
			var childern = table.find('tr');

			var render = view.render(childern);
			render.data('date', date);

			if(childern.length == 0) {
				table.append(render);
			} else {
				for(var i = 0; i < childern.length; i++) {
					var row = $(childern[i]);

					if(date < row.data('date')) {
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
		}
	});

	var DayView = Backbone.View.extend({
		tagName: 'tr',
		template: _.template($('#tmpl-panel-upcoming-show-day').html()),

		initialize: function() {
			var dateStr = this.collection.at(0).get('airdate');
			var date = moment(dateStr, 'YYYY-MM-DD');

			this.$el.html(this.template({
				dateLabel: date.format('dddd')
			}));

			this.$('.date-label').attr('title', date.format('dddd MMMM D, YYYY')).tooltip({placement: 'right'});

			this.addEpisode(this.collection.at(0));
			this.collection.on('add', this.addEpisode, this);
		},

		render: function(childern) {
			return this.$el;
		},

		addEpisode: function(episode) {
			var view = new EpisodeView({model: episode});

			var list = this.$('.list-episodes');
			var childern = list.find('li');

			var render = view.render();

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
		}
	});

	var EpisodeView = Backbone.View.extend({
		tagName: 'li',
		template: _.template($('#tmpl-panel-recently-aired-show-item').html()),

		initialize: function() {
			var season = this.model.get('season')
			  , epDate = this.model.get('airdate')
			  , epNum = this.model.get('episode')
			  , epName = this.model.get('ep_name')
			  , epPlot = this.model.get('ep_plot')
			  , showName = this.model.get('show_name')
			  , airs = this.model.get('airs')
			  , network = this.model.get('network');

			epPlot	= (epPlot == '') ? 'No episode plot given' : epPlot;
			airs	= (airs) ? airs : '00:00';

			var epTime = airs.match(/(\d+):(\d+)(\s*)(\w*)/);
			var time = parseInt(epTime[1] + '' + epTime[2]);
			time = (epTime[4] == 'PM') ? 1200 + time : time;

			this.$el.data('time', time);

			time = String((time.length == 3) ? '0' + time : time);

			var hours = parseInt(time.substr(0, 2))
			  , minutes = time.substr(2, 4);

			var ampm = 'AM';
			if(hours > 12) {
				hours -= 12;
				ampm = 'PM';
			}

			var epDateMoment = moment(epDate + ' ' + hours + ':' + minutes + ' ' + ampm, 'YYYY-MM-DD h:mm A');
			var isEpMissed = moment().isAfter(epDateMoment);

			var showPoster = App.Config.WebRoot + '/api/sickbeard/poster?showId=' + this.model.get('show_id') + '&width=200';
			var templateObj = {
				epCode: season + 'x' + epNum,
				epDateFromNow: epDateMoment.fromNow(),
				epPlot: epPlot,
				epTime: epTime[0].toLowerCase(),
				epTitle: epName,
				showName: showName,
				showPoster: showPoster,
				showTimeAndNetwork: airs + ' on ' +  network
			};

			this.$el.html(this.template(templateObj));

			if(isEpMissed) {
				this.$('.poster').addClass('missing-episode');
			}

			var img = $('<img/>', {src: showPoster}).load(function() {
				this.$('.poster').show();
			}.bind(this));

			var popoverTmpl = _.template($('#tmpl-panel-upcoming-show-popover').html());
			this.$('.poster img').popover({
				html: true,
				content: popoverTmpl(templateObj),
				trigger: 'hover',
				placement: 'bottom'
			});
		},

		remove: function() {

		},

		render: function() {
			return this.$el;
		}
	});

	App.View.Panel.UpComingShows = View;
})(App, jQuery, _, Backbone, moment);
