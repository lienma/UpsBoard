!(function(App, $, _, Backbone) {
	var Model = Backbone.Model.extend({
		url: App.Config.WebRoot + '/stats/disks'
	});

	var DiskModel = Backbone.Model.extend({
		idAttribute: '_id',
	});

	var Collection = Backbone.Collection.extend({
		model: DiskModel
	});

	var BaseModel = new Model();
	BaseModel.fetch();



	setInterval(function() {
		if(!App.Config.StopUpdating) {
			BaseModel.fetch();
		}
	}, App.Config.UpdateDelayLong);

	App.BaseDisk = BaseModel;
	App.Disks = new Collection();

	BaseModel.on('change:collection', function(model) {
		App.Disks.set(model.get('collection'));
	});

})(App, jQuery, _, Backbone);
