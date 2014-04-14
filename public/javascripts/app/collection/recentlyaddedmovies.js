define([
	'backbone',

	'app/model/recentlyaddedmovie'
], function(Backbone, Model) {

	var Collection = Backbone.Collection.extend({
		model: Model,
		url: Config.WebRoot + '/api/plex/recentlyAddedMovies'
	});

	return Collection;
});