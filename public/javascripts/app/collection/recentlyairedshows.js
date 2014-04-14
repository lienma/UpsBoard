define([
	'backbone',

	'app/model/recentlyairedshows'
], function(Backbone, Model) {

	var Collection = Backbone.Collection.extend({
		model: Model,

		unwatched: true,

		url: function() {
			return Config.WebRoot + '/api/plex/recentlyAired?limit=20&unwatched=' + this.unwatched;
		}
	});
	return Collection;
});