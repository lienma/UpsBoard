!(function(App, $, _, Backbone) {

	function formatBytes(bytes) {
		return numeral(bytes).format('0.00 b');
	}

	var View = Backbone.View.extend({
		template: _.template($('#tmpl-bottom-display-item').html()),
		initialize: function() {
			var base = this;

			this.listenTo(this.model, 'change', this.update);
			this.$el.html(this.template(this.model.attributes));
			this.detailDiv = this.$('.detail');

			this.progressBar = $('<div/>', {class: 'progress-bar'});
			this.progressDiv = $('<div/>', {class: 'progress'}).append(this.progressBar).tooltip();
			this.$('.progressDiv').append(this.progressDiv);

			App.BaseDisk.on('change:total', this.update, this);
			App.BaseDisk.on('change:used', this.update, this);
		},

		update: function() {
			var total = App.BaseDisk.get('total'), used = App.BaseDisk.get('used');

			var percent = Math.floor(used / total * 100);
			var detail = (App.Config.IsLoggedIn) ? formatBytes(used) + ' / ' + formatBytes(total) : percent + '% Used';

			this.detailDiv.html(detail);
			var loadColor = '';
			if(percent >= 75 && 90 > percent) {
				loadColor = 'progress-bar-warning';
			} else if(percent>= 90) {
				loadColor = 'progress-bar-danger';
			}

			this.progressDiv.attr('data-original-title', percent + '% Full')
			this.progressBar.css({width: percent + '%'});
			this.progressBar.removeClass('progress-bar-warning progress-bar-danger').addClass(loadColor);
		},

		render: function() {
			return this.$el;
		}
	});

	App.View.BottomBar.Space = View;
})(App, jQuery, _, Backbone);
