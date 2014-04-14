define([
	'backbone', 'numeral',
	'tmpl!view/bottombar-item',
	'bootstrap'
], function(Backbone, numeral, TmplBottomBar) {
	function formatBytes(bytes) {
		return numeral(bytes).format('0.00 b');
	}

	var View = Backbone.View.extend({
		template: TmplBottomBar,


		initialize: function() {

			this.$el.html(this.template(this.model.attributes));
			this.divDetail = this.$('.detail');

			this.drives = this.model.get('drivesModel');

			this.barProgress = $('<div/>', {class: 'progress-bar'});
			this.divProgress = $('<div/>', {class: 'progress'}).append(this.barProgress).tooltip();
			this.$('.progressDiv').append(this.divProgress);

			this.listenTo(this.drives, 'change:total', this.update);
			this.listenTo(this.drives, 'change:used', this.update);
		},

		update: function() {
			var total = this.drives.get('total'), used = this.drives.get('used');

			var percent = Math.floor(used / total * 100);
			var detail = (Config.IsLoggedIn) ? formatBytes(used) + ' / ' + formatBytes(total) : percent + '% Used';

			this.divDetail.html(detail);

			var loadColor = '';
			if(percent >= 75 && 90 > percent) {
				loadColor = 'progress-bar-warning';
			} else if(percent>= 90) {
				loadColor = 'progress-bar-danger';
			}

			this.divProgress.attr('data-original-title', percent + '% Full')
			this.barProgress.css({width: percent + '%'});
			this.barProgress.removeClass('progress-bar-warning progress-bar-danger').addClass(loadColor);
		},

		render: function() {
			return this.$el;
		}
	});

	return View;
});