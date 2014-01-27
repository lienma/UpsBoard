!(function(App, $, _, Backbone) {


	var RecentlyAiredShowsModel = Backbone.Model.extend({
		idAttribute: '_id'
	});

	var RecentlyAiredShowsCollection = Backbone.Collection.extend({
		model: RecentlyAiredShowsModel,

		unwatched: true,

		url: function() {
			return App.Config.WebRoot + '/api/plex/recentlyAired?unwatched=' + this.unwatched;
		}
	});

	var RecentlyAiredShowsView = Backbone.View.extend({
		el: 'div.panel.recentlyAiredShows',
		interval: null,

		events: {
			'click .tab.all a': 'changeTabAll',
			'click .tab.unwatched a': 'changeTabUnwatched'
		},

		initialize: function() {
			this.collection = new RecentlyAiredShowsCollection();
			this.collection.on('add', this.addShow, this);
			this.collection.on('remove', this.removeShow, this);

			if(!App.Config.IsLoggedIn) {
				this.$('.tabs').hide();
			}

			this.fetch();
		},

		addShow: function(show) {
			show.view = new RecentlyAiredShowsItemView({ model: show });

			var index = this.collection.indexOf(show)
			  , view = show.view.render()
			  , items = this.$('ul').children();

			var pos = (index == 0) ? 0 : index - 1;

			if(index == 0) {
				this.$('ul')[(items.length == 0) ? 'append' : 'prepend'](view);
			} else {
				$(items[pos]).after(view);
			}
		},

		removeShow: function(show) {
			show.view.removeShow();
		},

		changeTabAll: function(event) {
			event.isPropagationStopped();

			if(this.collection.unwatched) {
				this.collection.unwatched = false;
				this.$('.tab.all').addClass('active');
				this.$('.tab.unwatched').removeClass('active');

				this.fetch();
			}
			return false;
		},

		changeTabUnwatched: function(event) {
			event.isPropagationStopped();

			if(!this.collection.unwatched) {
				this.collection.unwatched = true;
				this.$('.tab.all').removeClass('active');
				this.$('.tab.unwatched').addClass('active');

				this.fetch();
			}
			return false;
		},

		fetch: function() {
			var self = this;

			this.collection.fetch();
			if(!this.interval) {
				this.interval = App.Funcs.IntervalTimeout(function() {
					self.collection.fetch();
				}, App.Config.UpdateDelayLong);
			}
		}
	});

	var RecentlyAiredShowsItemView = Backbone.View.extend({
		tagName: 'li',
		template: _.template($('#tmpl-panel-recently-aired-show-item').html()),
		initialize: function() {
			this.listenTo(this.model, 'remove', this.removeShow);

			var showPoster = App.Config.WebRoot + '/api/plex/poster?location=' + encodeURIComponent(this.model.get('tvShowThumbnail')) + '&width=200&height=400'
			  , epPlot = this.model.get('epPlot')
			  , epPoster = App.Config.WebRoot + '/api/plex/poster?location=' + encodeURIComponent(this.model.get('epThumbnail'))
			  , epAdded = moment.unix(this.model.get('addedAt'));

			var templateObj = {
				epAddedFormated: epAdded.fromNow(),
				epNumber: this.model.get('epNumber'),
				epPlot: (epPlot == '') ? 'No episode plot given' : epPlot,
				epPoster: epPoster,
				epSeason: this.model.get('epSeason'),
				epTitle: this.model.get('epTitle'),
				loggedIn: App.Config.IsLoggedIn,
				showName: this.model.get('tvShowTitle'),
				showPoster: showPoster,
				watched: (App.Config.IsLoggedIn) ? this.model.get('watched') : false
			};

			

			this.$el.html(this.template(templateObj));

			var base = this;
			var img = $('<img/>', {src: showPoster}).load(function() {
				base.$('.poster').show();
			});

			var pTemplate = _.template($('#tmpl-panel-recently-aired-show-popover').html());

			this.$('.poster img').popover({
				html: true,
				content: pTemplate(templateObj),
				trigger: 'hover',
				placement: 'bottom'
			});
		},

		removeShow: function() {
			this.$('.poster img').popover('destroy');
			this.remove();
		},

		render: function() {
			return this.$el;
		}
	});

	App.View.Panel.RecentlyAiredShows = RecentlyAiredShowsView;
})(App, jQuery, _, Backbone);