define([
	'backbone',
	'app/model/sabnzbd/slot'
], function(Backbone, Model) {

	var Collection = Backbone.Collection.extend({
		model: Model,
		forceUpdate: function() { },

		isHistory: false
	});

	return Collection;
});