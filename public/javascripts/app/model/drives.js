define([
	'backbone',
], function(Backbone) {

	var Model = Backbone.Model.extend({
		url: Config.WebRoot + '/stats/disks',

		fetchAll: function() {
console.log('booo');
			return this.fetch();
		}
	});

	return Model;
});