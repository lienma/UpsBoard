define([
	'backbone', 'moment', 'bootstrap'
], function(Backbone, moment) {

	var View = Backbone.View.extend({
		initialize: function() {

			this.clock = this.$('.clock');

			this.update();

			setInterval(function() { this.update(); }.bind(this), 30000);
		},

		update: function() {
			var m = moment();
			this.clock.tooltip({
				placement: 'left',
				title: m.format('dddd, MMMM D, YYYY')
			});

			this.clock.find('.time').html(m.format('h:mm'));
			this.clock.find('.ampm').html(m.format('A'));
		}
	});

	return View;
});
