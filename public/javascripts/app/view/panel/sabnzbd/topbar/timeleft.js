define([
	'backbone',

	'app/func/tooltip'
], function(Backbone, Tooltip) {

	var View = Backbone.View.extend({

		initialize: function() {
			this.tooltip = Tooltip({
				el: this.$el.parent(),
				placement: 'bottom',
			});

			this.updateTimeLeft();
			this.updatePause();
			this.updateEta();

			this.listenTo(this.model, 'change:timeleft', this.updateTimeLeft);
			this.listenTo(this.model, 'change:paused', this.updatePause);
			this.listenTo(this.model, 'change:eta', this.updateEta);
		},

		updateEta: function() {
			this.tooltip.update('ETA: ' + this.model.get('eta'));
		},

		updateTimeLeft: function() {
			if(!this.model.get('paused')) {
				this.$el.text(this.model.get('timeleft'));
			}
		},

		updatePause: function() {
			this.$el.text(this.model.get('paused') ? '--' : this.model.get('timeleft'));
		}
	});

	return View;
});