define([
	'backbone',

	'tmpl!view/sabnzbd/topbar/speed-modal',
	'bootstrap'
], function(Backbone, TmplModal) {

	var View = Backbone.View.extend({

		events: {
			'click': 'click'
		},

		initialize: function() {
			this.modal = $(TmplModal());
			this.modal.appendTo('body');

			this.update();
			this.listenTo(this.model, 'change:kbpersec', this.update);

		},

		update: function(model) {
			var kilobytes = Math.round(parseFloat(this.model.get('kbpersec')));

			var unit = 'KB/s';
			if(kilobytes >= 1024) {
				unit = 'MB/s';
			}

			kilobytes = (kilobytes >= 1024) ? Math.round(kilobytes / 1024 * 10) / 10 : kilobytes;

			this.$('.number').html(kilobytes);
			this.$('.unit').text(' ' + unit);
		},

		click: function() {
			this.modal.modal();
		}
	});

	return View;
});