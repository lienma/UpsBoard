!(function(App, $, _, Backbone) {
	var Model = Backbone.Model.extend({
		url: App.Config.WebRoot + '/api/sickbeard/showsStats'
	});

	var View = Backbone.View.extend({
		el: '.panel.tvCompletion',

		initialize: function() {
			var self = this;
			this.listenTo(this.model, 'change', this.update);
			this.model.fetch();
			App.Funcs.IntervalTimeout(function() {
				self.model.fetch();
			}, App.Config.UpdateDelayLong);
		},

		update: function(model) {
			var percent = model.get('percentComplete');
			this.$('.percent').text(percent + '%');
			this.$('.progress-bar').css({
				width: percent + '%'
			});

			if(App.Config.IsLoggedIn) {
				var title = 'Download: ' + model.get('epDownloaded').toLocaleString() + '<br /> Total: ' + model.get('epTotal').toLocaleString();

				var progress = this.$('.progress');
				progress.attr((progress.attr('data-original-title')) ? 'title' : 'data-original-title', title)
				progress.tooltip({html: true, placement: 'bottom'});
			}
		},

		render: function() {
			return this.$el;
		}
	});

	function Panel() {
		var model = new Model();
		new View({ model: model });
	}

	App.View.Panel.Stat.TVCompletion = Panel;
})(App, jQuery, _, Backbone);
