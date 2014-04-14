define([
	'backbone', 'numeral',
	'tmpl!view/drive-item',
	'bootstrap'
], function(Backbone, numeral, TmplDrive) {

	var View = Backbone.View.extend({
		tagName: 'li',

		template: TmplDrive,

		initialize: function() {

			var tmpl = this.model.attributes;
			tmpl.percent = Math.round(this.model.get('used') / this.model.get('total') * 100);

			this.$el.html(this.template(tmpl)).addClass('media');

			this.listenTo(this.model, 'change', this.updateView);
			this.listenTo(this.model, 'change:offline', this.updateOffline);
			this.listenTo(this.model, 'change:used', this.updateSpaceText);

			this.buildView();
			this.updateView();

		},

		buildView: function() {
			var icon = this.model.get('icon');
			if(icon) {
				this.$('img').attr('src', Config.WebRoot + icon);
			}

			if(this.model.get('offline')) {
				this.updateOffline();
			} else {
				if(Config.IsLoggedIn) {
					this.updateSpaceText();
				} else {
					this.$('.loggedIn').hide();
				}
			}
		},

		updateOffline: function() {
			if(this.model.get('offline')) {
				this.$('.server-offline').show();
				this.$('.server-online').hide();
				this.$('.loggedIn').hide();

			} else {
				this.$('.server-offline').hide();
				this.$('.server-online').show();
			}
		},

		updateSpaceText: function() {
			if(Config.IsLoggedIn) {
				var usedSpace = this.model.get('used')
				  , totalSpace = this.model.get('total');

				this.$('.usedSpace').html(numeral(usedSpace).format('0.00 b'));
				this.$('.totalSpace').html(numeral(totalSpace).format('0.00 b'));
			}
		},

		getPercentageClass: function(percent) {
			var loadColor = '';
			if(percent >= 75 && 90 > percent) {
				loadColor = 'progress-bar-warning';
			} else if(percent>= 90) {
				loadColor = 'progress-bar-danger';
			}
			return loadColor;
		},

		updateView: function() {
			if(!this.model.get('offline')) {
				var total = this.model.get('total')
				  , used = this.model.get('used');

				var percent = Math.round(used / total * 100);

				this.$('.progress').attr('title', percent + '% Full').tooltip();
				var progress = this.$('.progress .progress-bar').css({width: percent + '%'});
				progress.removeClass('progress-bar-warning progress-bar-danger').addClass(this.getPercentageClass(percent));
			}
		},

		render: function() {
			return this.$el;
		}
	});

	return View;
});