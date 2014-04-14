define([
	'jquery', 'backbone'
], function($, Backbone) {

	var Model = Backbone.Model.extend({
		idAttribute: 'nzo_id',

		call: function(method, value) {
			var isHistory = this.collection.isHistory ? 'history' : 'queue';

			var url = Config.WebRoot + '/api/sabnzbd/' + isHistory + '/' + this.id + '/' + method;
			if(value) {
				url += '/' + value;
			}

			var defer = $.Deferred();
			$.getJSON(url).done(function(data) {
				this.forceUpdate();

				defer.resolve(data);
			}.bind(this)).fail(defer.reject);

			return defer.promise();
		},

		forceUpdate: function() {
			return this.collection.forceUpdate();
		}
	});

	return Model;
});