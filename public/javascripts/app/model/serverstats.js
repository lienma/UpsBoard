define([
	'backbone',
], function(Backbone) {

	var Model = Backbone.Model.extend({
		url: Config.WebRoot + '/stats/all'
	});

	return Model;
});