!(function(App, $, _, Backbone) {
	var Model = Backbone.Model.extend({
		idAttribute: '_id'
	});

	var Collection = Backbone.Collection.extend({
		model: Model,
		url: App.Config.WebRoot + '/stats/disks'
	});

	App.Collection.Disks = Collection;
})(App, jQuery, _, Backbone);
