define([
	'backbone',
], function(Backbone) {

	var Model = Backbone.Model.extend({
		url: Config.WebRoot + '/api/sickbeard/showsStats'
	});

	return Model;
});