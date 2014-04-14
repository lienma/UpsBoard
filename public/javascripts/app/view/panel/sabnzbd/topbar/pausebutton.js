define([
	'jquery', 'backbone',

	'app/func/tooltip'
], function($, Backbone, Tooltip) {

	var View = Backbone.View.extend({

		messageResume: 'Resume the downloading queue.',
		messagePause: 'Pause the downloading queue.',

		events: {
			'click': 'action'
		},

		initialize: function() {

			this.listenTo(this.model, 'change:paused', this.update);

			if(this.model.get('paused')) {
				this.$el.addClass('enabled');
			}

			this.tooltip = Tooltip({
				el: this.$el,
				placement: 'bottom',
				title: (this.model.get('paused')) ? this.messageResume : this.messagePause
			});
		},

		action: function() {
			if(!this.$el.hasClass('rotate-icon')) {
				this.$el.addClass('rotate-icon');

				this.tooltip.update('Sending Request');

				var method = this.model.get('paused') ? 'resumeQueue' : 'pauseQueue';
				$.getJSON(Config.WebRoot + '/api/sabnzbd/' + method).done(this.actionComplete.bind(this));
			}
		},

		actionComplete: function(data) {
			this.model.forceUpdate().done(function() {
				this.$el.removeClass('rotate-icon');
			}.bind(this));
		},

		update: function() {
			var paused = this.model.get('paused');

			if(paused) {
				this.$el.addClass('enabled');
			} else {
				this.$el.removeClass('enabled');
			}

			this.tooltip.update((paused) ? this.messageResume : this.messagePause);
		}
	});

	return View;
});