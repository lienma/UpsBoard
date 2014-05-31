define([
	'jquery', 'underscore', 'backbone',

	'tmpl!view/topbar/accountsettings'
], function($, _, Backbone, TmplModal) {

	var View =  Backbone.View.extend({
		initialize: function() {
			this.modal = $(TmplModal());
			this.modal.modal();
		}
	});

	return View;
});