define([
	'backbone', 'numeral'
], function(Backbone, numeral) {

	var View = Backbone.View.extend({
		initialize: function() {

			this.listenTo(this.model, 'change:percentage', this.updatePercentage);
			this.listenTo(this.model, 'change:mbleft', this.updateSizeLeft);
			this.listenTo(this.model, 'change:mb', this.updateSizeTotal);
			this.listenTo(this.model, 'change:priority', this.updatePriority);
			this.listenTo(this.model, 'change:status', this.updatePaused);

			this.updatePercentage();
			this.updateSizeLeft();
			this.updateSizeTotal();
			this.updatePriority();
			this.updatePaused();
		},

		getSizeLeft: function() {
			return numeral(this.model.get('mbleft')).format('0,0');
		},
		getSizeTotal: function() {
			return numeral(this.model.get('mb')).format('0,0');
		},

		getPercentage: function() {
			return this.model.get('percentage')
		},

		updatePaused: function() {
			var func = (this.model.get('status') != 'Paused') ? 'addClass' : 'removeClass';
			this.$('.progress')[func]('progress-striped active')
		},

		updatePercentage: function() {
			var percentage = this.getPercentage() + '%';

			this.$('.percentage-text').text(percentage);
			this.$('.progress-bar').css('width', percentage);
		},

		updatePriority: function() {
			var bar = this.$('.progress-bar');

			var className = false;
			switch(this.model.get('priority')) {
				case 'Force':
					className = 'warning';
					break;
				case 'High':
					className = 'success';
					break;
				case 'Low':
					className = 'info';
					break;
			}

			bar.removeClass('progress-bar-success progress-bar-warning progress-bar-info');
			bar.addClass((className) ? 'progress-bar-' + className : '');
		},

		updateSizeLeft: function() {
			this.$('.mb-left').text(this.getSizeLeft() + ' MB');	
		},

		updateSizeTotal: function() {
			this.$('.mb-total').text(this.getSizeTotal() + ' MB');	
		}
	});

	return View;
});