!(function(App, $, _, Backbone) {
	var Model = Backbone.Model.extend({
		url: App.Config.WebRoot + '/api/sickbeard/showsStats'
	});

	var View = Backbone.View.extend({
		el: '.panel.tvCompletion',

		initialize: function() {
			var base = this;
			this.listenTo(this.model, 'change', this.update);
			this.model.fetch();
			App.Funcs.IntervalTimeout(function() {
				base.model.fetch();
			}, App.Config.UpdateDelayLong);
		},

		update: function(model) {
			var percent = this.model.get('percentComplete');
			this.$('.percent').text(percent + '%');
			this.$('.progress-bar').css({
				width: percent + '%'
			});
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
