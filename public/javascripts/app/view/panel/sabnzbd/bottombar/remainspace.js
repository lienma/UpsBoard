define([
	'jquery', 'backbone', 'numeral'

], function($, Backbone, numeral) {

	var View = Backbone.View.extend({

		initialize: function(options) {
			this.buildView();

			this.listenTo(this.model, 'change:mb', this.updateTotal);
			this.listenTo(this.model, 'change:mbleft', this.updateLeft);

			this.updateTotal(this.model);
			this.updateLeft(this.model);
		},

		buildView: function() {
			this.left = $('<span/>');
			this.total = $('<span/>');

			var slash = $('<span> / </span>');
			this.$el.append(this.left).append(slash).append(this.total);
		},

		getSize: function(mb) {
			var bytes = Math.round(parseFloat(mb) * 1024 * 1024);
			return numeral(bytes).format('0.0 b');
		},

		updateLeft: function(model) {
			var left = this.getSize(this.model.get('mbleft'));
			this.left.text(left);
		},

		updateTotal: function(model) {
			if(parseInt(this.model.get('mb')) == 0) {
				this.$el.hide();
			} else {
				this.$el.show();
				var total = this.getSize(this.model.get('mb'));
				this.total.text(total);
			}
		},

		render: function() {
			return this.$el;
		}
	});

	return View;
});
