define([
	'jquery', 'backbone', 'underscore',

	'tmpl!view/sabnzbd/modal/deletenzb',

	'bootstrap'
], function($, Backbone, _, TmplModal) {

	var View = Backbone.View.extend({
		initialize: function() {
			_.extend(this, Backbone.Events);
		},

		action: function(event) {
			this.trigger('delete', $(event.target).data('files'));
			this.modal.modal('hide');
		},

		open: function() {
			this.trigger('opened');

			this.modal = $(TmplModal());
			$(this.modal.find('.btn-modal-delete')).click(this.action.bind(this));

			this.modal.modal();
			this.modal.on('hidden.bs.modal', function(event) {
				$(event.target).remove();
			}).on('hide.bs.modal', function() {
				this.trigger('closed');
			}.bind(this));
		}
	});

	return View;
});