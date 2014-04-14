define([
	'backbone',
], function(Backbone) {

	var Model = Backbone.Model.extend({
		idAttribute: '_id'
	});

	return Model;
});