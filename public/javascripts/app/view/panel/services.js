define([
	'backbone',

	'app/collection/services',
	'app/view/panel/services/item',

	'app/func/intervaltimeout'
], function(Backbone, Collection, ItemView, Timeout) {

	var View = Backbone.View.extend({
		el: '.panel.panel-services',

		initialize: function() {
			var base = this;

			this.collection = new Collection();
			this.collection.on('add', this.addService, this);

			this.timeout = Timeout(this.fetch.bind(this));
			this.timeout.start();
		},

		addService: function(service) {
			var view = new ItemView({ model: service });
			this.$('.container-services').append(view.render());
		},

		fetch: function() {
			this.collection.fetch();
		},

		render: function() {
			return this.$el;
		}
	});

	return View;
});