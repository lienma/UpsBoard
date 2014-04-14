define([
	'backbone', 'app/model/drive',
], function(Backbone, Model) {

	var Collection = Backbone.Collection.extend({
		model: Model
	});

	return Collection;
});