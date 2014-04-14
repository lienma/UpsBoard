define([
	'backbone',

	'tmpl!view/sabnzbd/topbar/add-nzb-modal',
	'bootstrap'
], function(Backbone, TmplModal) {

	var View = Backbone.View.extend({

		events: {
			'click': 'click'
		},

		initialize: function() {
			this.modal = $(TmplModal());
			this.modal.appendTo('body');

		},

		click: function() {
			this.modal.modal();
		}
	});

	return View;
});