define([
	'backbone',

	'app/model/upcomingshow'
], function(Backbone, EpisodeModel) {

	var Collection = Backbone.Collection.extend({
		model: EpisodeModel,
		url: Config.WebRoot + '/api/sickbeard/upcoming'
	});

	return Collection;
});