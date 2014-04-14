define([
	'backbone',

	'app/model/sickbeard/stats', 'app/func/intervaltimeout',

	'bootstrap'
], function(Backbone, Model, Timeout) {

	var View = Backbone.View.extend({
		el: '.panel.tvCompletion',

		initialize: function() {
			this.model = new Model();

			this.listenTo(this.model, 'change', this.update);


			this.timeout = new Timeout(this.fetch.bind(this), Config.UpdateDelayLong);
			this.timeout.start();
		},

		fetch: function() {
			this.model.fetch();
		},

		update: function() {
			var percent = this.model.get('percentComplete');

			this.$('.percent').text(percent + '%');

			this.$('.progress-bar').css({
				width: percent + '%'
			});

			if(Config.IsLoggedIn) {
				var title = 'Download: ' + this.model.get('epDownloaded').toLocaleString() + '<br />Total: ' + this.model.get('epTotal').toLocaleString();

				var progress = this.$('.progress');
				progress.attr((progress.attr('data-original-title')) ? 'title' : 'data-original-title', title);
				progress.tooltip({html: true, placement: 'bottom'});
			}
		},
	});

	return View;
});
