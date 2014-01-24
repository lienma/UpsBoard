!(function(App, $, _, Backbone) {
	var UpComingShowsModel = Backbone.Model.extend({
		idAttribute: '_id'
	});

	var UpComingShowsCollection = Backbone.Collection.extend({
		model: UpComingShowsModel,
		url: App.Config.WebRoot + '/api/sickbeard/upcoming'
	});

	var UpComingShowsView = Backbone.View.extend({
		el: 'div.panel.upComingShows',

		initialize: function() {
			this.collection = new UpComingShowsCollection();
			this.collection.on('add', this.addShow, this);

			var base = this;
			this.collection.fetch();
			App.Funcs.IntervalTimeout(function() {
				base.collection.fetch();
			}, App.Config.UpdateDelayLong);

			//this.$('.ucs-body').perfectScrollbar();
		},

		addShow: function(show) {
			var view = new UpComingShowsItemView({ model: show });
			this.$('table.showList').append(view.render());
		}
	});

	function weekdayName(num) {
		switch(num) {
			case 1: return 'Monday';
			case 2: return 'Tuesday';
			case 3: return 'Wednesday';
			case 4: return 'Thursday';
			case 5: return 'Friday';
			case 6: return 'Saturday';
			case 7: return 'Sunday';
		}
	}

	var UpComingShowsItemView = Backbone.View.extend({
		tagName: 'tr',
		template: _.template($('#tmpl-panel-upcoming-show-item').html()),
		initialize: function() {
			this.listenTo(this.model, 'remove', this.removeShow);

			var season = this.model.get('season')
			  , epDate = this.model.get('airdate')
			  , epNum = this.model.get('episode')
			  , epName = this.model.get('ep_name')
			  , epPlot = this.model.get('ep_plot')
			  , showName = this.model.get('show_name')
			  , airs = this.model.get('airs')
			  , network = this.model.get('network');

			var showPoster = App.Config.WebRoot + '/api/sickbeard/poster?showId=' + this.model.id;

			var epTime = airs.match(/(\d+):(\d+) (\w+)/);
			var epDateMoment = moment(epDate +  epTime, "YYYY-MM-DD h:mm A");
			var isEpMissed = moment().isAfter(epDateMoment);

			epPlot = (epPlot == '') ? 'No episode plot given' : epPlot;

			var templateObj = {
				epDate: epDate,
				epDateAirsAired: (isEpMissed) ? 'Aired' : 'Airs',
				epDateFromNow: epDateMoment.fromNow(),
				epPlot: epPlot,
				epTime: epTime,
				epTitle: season + 'x' + epNum + ' - ' + epName,
				showName: showName,
				showPoster: showPoster,
				showTimeAndNetwork: airs + ' on ' +  network
			};

			this.$el.html(this.template(templateObj)).addClass((isEpMissed) ? 'missedEpisode' : '');
			this.$('i.moreInfo').popover({
				placement: 'left',
				trigger: 'hover',
				html: true,
				content: '<span class="small"><strong>Episode plot:</strong> <span class="small">' + epPlot + '</span></span>'
			});
		},

		removeShow: function() {
			this.$('i.moreInfo').popover('destory');
			this.remove();
		},

		render: function() {
			return this.$el;
		}
	});

	App.View.Panel.UpComingShows = UpComingShowsView;
})(App, jQuery, _, Backbone);
