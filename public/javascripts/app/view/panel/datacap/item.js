define([
	'backbone',

	'tmpl!view/datacap-item',
], function(Backbone, TmplView) {

	var View = Backbone.View.extend({
		tagName: 'li',

		template: TmplView,
		initialize: function() {
			var self = this;

			var tmpl = this.model.attributes;
			tmpl.percent = Math.round(this.model.get('cap') / this.model.get('capLimit') * 100);
			this.$el.html(this.template(tmpl)).addClass('media');

			this.listenTo(this.model, 'change:cap', this.update);
			this.update();
		},

		getPercentageClass: function(percent) {
			var color = '';
			if(percent < 21) {
				color = '-success';
			} else if(percent < 41) {
				color = '-info';
			} else if(percent < 61) {
				color = '';
			} else if(percent < 86) {
				color = '-warning';
			} else {
				color = '-danger'
			}
			return 'progress-bar' + color;
		},

		update: function() {
			var limit = this.model.get('capLimit')
			  , used = this.model.get('cap');

			this.$('.used').html((Config.IsLoggedIn) ? numeral(used).format('0 b') : used);
			this.$('.limit').html((Config.IsLoggedIn) ? numeral(limit).format('0 b') : limit);

			var percent = Math.round(used / limit * 100);

			this.$('.progress').attr('title', percent + '% Used').tooltip();
			var progress = this.$('.progress .progress-bar').css({width: percent + '%'});
			progress.removeClass('progress-bar-warning progress-bar-danger progress-bar-success progress-bar-info').addClass(this.getPercentageClass(percent));
		},

		render: function() {
			return this.$el;
		}
	});

	return View;
});