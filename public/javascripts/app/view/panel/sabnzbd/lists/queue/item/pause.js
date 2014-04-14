define([
	'backbone',

	'app/func/tooltip'
], function(Backbone, Tooltip) {

	var View = Backbone.View.extend({
		events: {
			'click': 'action'
		},

		messageResume: 'Resume this item',
		messagePause: 'Pause this item',

		initialize: function() {

			this.listenTo(this.model, 'change:status', this.update);

			if(this.isPaused()) {
				this.$el.addClass('enabled');
			}

			var message = (this.isPaused()) ? this.messageResume : this.messagePause;
			this.tooltip = new Tooltip({
				el: this.$el, title: message
			});
		},

		isPaused: function() {
			return (this.model.get('status') == 'Paused')
		},

		action: function() {
			if(!this.$el.hasClass('rotate-icon')) {
				this.$el.addClass('rotate-icon');
				this.tooltip.update('Sending Request');

				var method = this.isPaused() ? 'resume' : 'pause';
				$.getJSON(Config.WebRoot + '/api/sabnzbd/queue/' + this.model.id + '/' + method).done(function(data) {
					this.model.forceUpdate().done(function() {
						this.$el.removeClass('rotate-icon');
					}.bind(this));
				}.bind(this));
			}
		},

		update: function(model) {
			if(this.isPaused()) {
				this.$el.addClass('enabled');
			} else {
				this.$el.removeClass('enabled');
			}

			var message = (this.isPaused()) ? this.messageResume : this.messagePause;
			this.tooltip.update(message);
		},

	});

	return View;
});