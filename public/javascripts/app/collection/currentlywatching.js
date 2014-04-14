define([
	'backbone',

	'app/model/currentlywatching'
], function(Backbone, Model) {

	var Collection = Backbone.Collection.extend({
		model: Model,
		url: Config.WebRoot + '/api/plex/currentlyWatching'
	});

	return Collection;
});