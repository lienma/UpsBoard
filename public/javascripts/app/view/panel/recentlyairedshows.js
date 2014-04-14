define([
	'jquery', 'backbone',

	'app/collection/recentlyairedshows',
	'app/view/panel/recentlyairedshows/item',

	'app/func/intervaltimeout'
], function($, Backbone, Collection, ItemView, Timeout) {

	var View = Backbone.View.extend({
		el: '.recentlyAiredShows',
		interval: null,

		events: {
			'click .tab.all a': 'changeTabAll',
			'click .tab.unwatched a': 'changeTabUnwatched'
		},

		initialize: function() {
			this.collection = new Collection();
			this.collection.on('add', this.addShow, this);
			this.collection.on('remove', this.removeShow, this);

			if(Config.IsLoggedIn) this.$('.tabs').show();

			this.timeout = Timeout(this.fetch.bind(this), Config.UpdateDelayLong);
			this.timeout.start();
		},

		fetch: function() {
			this.collection.fetch();
		},

		addShow: function(show) {
			show.view = new ItemView({ model: show });

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
		}
	});

	return View;
});