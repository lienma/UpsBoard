define([
	'jquery', 'backbone',

	'tmpl!view/sabnzbd/topbar/speed-modal',
	'bootstrap'
], function($, Backbone, TmplModal) {

	var View = Backbone.View.extend({

		events: {
			'click': 'click'
		},

		initialize: function() {
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
			this.modal = $(TmplModal({speedlimit: this.model.get('speedlimit')}));
			this.modal.modal();
			this.modal.on('hidden.bs.modal', function(event) {
				$(event.target).remove();
			}).on('shown.bs.modal',  function() {
				$(this.modal.find('input')).focus();
			}.bind(this));

			$(this.modal.find('.btn-modal-reset')).click(this.btnReset.bind(this));
			$(this.modal.find('.btn-modal-save')).click(this.btnSave.bind(this));

			$(this.modal.find('input')).keyup(this.keyup);

		},

		keyup: function() {
			if(/\d+/.test($(this).val())) {
				$(this).parent().addClass('has-success').removeClass('has-error');
			} else {
				$(this).parent().addClass('has-error').removeClass('has-success');
			}
		},

		btnReset: function() {
			$(this.modal.find('input')).val('');
			$.getJSON(Config.WebRoot + '/api/sabnzbd/limit?speed=0').done(function() {
				this.modal.modal('hide')
			}.bind(this));
		},

		btnSave: function() {
			var speed = $(this.modal.find('input')).val();
			if(/\d+/.test(speed)) {

				$(this.modal.find('.form-group')).addClass('has-success').removeClass('has-error');
				$.getJSON(Config.WebRoot + '/api/sabnzbd/limit?speed=' + speed).done(function() {

					this.modal.modal('hide');
					this.model.set('speedlimit', speed);
				}.bind(this));
			} else {
				$(this.modal.find('.form-group')).addClass('has-error').removeClass('has-success');
			}
		}
	});

	return View;
});