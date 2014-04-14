define([
	'backbone',
	'app/model/service'
], function(Backbone, Model) {

	var Collection = Backbone.Collection.extend({
		model: Model,
		url: Config.WebRoot + '/stats/services'
	});

	return Collection;
});