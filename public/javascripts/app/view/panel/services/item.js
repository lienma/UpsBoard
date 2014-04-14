define([
	'backbone',

	'tmpl!view/service-item',

	'bootstrap'
], function(Backbone, TmplItem) {

	var View = Backbone.View.extend({
		tagName: 'div',

		initialize: function() {
			this.listenTo(this.model, 'change', this.update);
			this.$el.html(TmplItem(this.model.attributes));


			this.$el.addClass('service-item min').attr('title', this.model.get('label')).tooltip();
			if(this.model.get('url')) {
				this.$('a.btn').attr('href', this.model.get('url'));
			} else {
				this.$('a.btn').addClass('disabled');
			}
		
			this.update();	
		},

		update: function() {
			var isOnline = this.model.get('online');

			var statusIcon = (isOnline) ? 'glyphicon-ok' : 'glyphicon-remove'
			  , statusBtn = (isOnline) ? 'btn-success' : 'btn-warning';

			this.$('i.glyphicon').removeClass('glyphicon-ok glyphicon-remove').addClass(statusIcon);

			this.$('a.btn.btn-xs').removeClass('btn-success btn-warning').addClass(statusBtn);

			if(this.model.get('url')) {
				if(isOnline) {
					this.$('a.btn.btn-xs').removeClass('disabled');
				} else {
					this.$('a.btn.btn-xs').addClass('disabled');
				}
			}
		},

		render: function() {
			return this.$el;
		}
	});

	return View;
});