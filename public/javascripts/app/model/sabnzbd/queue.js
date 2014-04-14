define([
	'jquery', 'backbone',
], function($, Backbone) {

	var Model = Backbone.Model.extend({

		initialize: function(queue) {
			this.queueType		= queue;

			this.limit			= 10;
			this._stopUpdating	= false;
			this._failedFetches	= 0;
			this._timeout		= null;
		},

		forceUpdate:	function() { return this._fetch(); },
		forceOneUpdate:	function() { return this.fetch(); },
		url:			function() { return Config.WebRoot + '/api/sabnzbd/' + this.queueType + '?start=0&limit=' + this.limit; },
		resetLimit:		function() { this.limit = 10; },
		setLimit:		function(limit) { this.limit = limit; },
		stop:			function() { this._stopUpdating = true; },

		start: function() {
			var defer = $.Deferred();
			this._fetch().done(defer.resolve).fail(defer.reject);
			return defer.promise();
		},

		_startTimeout: function() {
			this._timeout = setTimeout(function() {
				this._timeout = null;

				if(this._stopUpdating) {
					this._stopUpdating = false;

					return;
				}

				this._fetch().done(function() {
					this._failedFetches = 0;
				}.bind(this)).fail(function() {
					this._failedFetches += 1;
				}.bind(this));
			}.bind(this), (this._failedFetches > 450) ? 30000 : Config.UpdateDelayShort);
		},

		_fetch: function() {

			if(this._timeout != null) {
				clearTimeout(this._timeout);
				this._timeout = null;
			}

			//if(!Config.StopUpdating) {
				this._startTimeout();
			//}

			return this.fetch();
		}
	});

	return Model;
});