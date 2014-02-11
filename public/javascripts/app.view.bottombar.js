
(function(App, $, _, Backbone) {

	var StatsModel = Backbone.Model.extend({
		url: App.Config.WebRoot + '/stats/all'
	});

	var BottomBarModel = Backbone.Model.extend({
		idAttribute: 'selector'
	});

	var BottomBarView = Backbone.View.extend({
		el: 'div.bottom-display-bar',
		ul: null,

		modules: [
			{'selector': 'Cpu', 'title': 'CPU', class: 'col-md-3', usingStatsModel: true},
			{'selector': 'Memory', 'title': 'Memory', class: 'col-md-3', usingStatsModel: true},
			{'selector': 'Bandwidth', 'title': 'Bandwidth', class: 'col-md-3', usingStatsModel: true},
			{'selector': 'Space', 'title': 'Total Space', class: 'col-md-3', usingStatsModel: false}
		],

		views: {},

		initialize: function() {
			this.row = this.$('div.row');
			this.statsModel = new StatsModel();

			this.buildModules();
			this.render();
			this.fetch();

			var self = this;
			$('.bottom-bar-padding').css({height: this.$el.height() + 'px'});
			$(window).on('resize', function() {
				$('.bottom-bar-padding').css({height: self.$el.height() + 'px'});
			});
		},

		buildModules: function() {
			var self = this;
			this.modules.forEach(function(module) {
				var moduleName = module.selector
				  , model = new BottomBarModel(module);

				self.views[moduleName] = new App.View.BottomBar[moduleName]({model: model});
				if(module.usingStatsModel) {
					self.statsModel.on('change:' + moduleName, function(model) {
						var newModel = model.get(moduleName);

						if(_.isArray(newModel)) {
							newModel = {collection: newModel};
						}

						self.views[moduleName].model.set(newModel);
					}, this);
				}
			});
		},

		fetch: function() {
			var self = this, failedCount = 0;

			var timeout = setTimeout(function() {
				fetch();
				failedCount += 1;
			}, 15000);


			function fetch() {
				self.statsModel.fetch({success: function() {
					if(!App.Config.StopUpdating) {
						self.fetch();
					}
					clearTimeout(timeout);
					failedCounter = 0;
				}});
			}

			fetch();
		},

		render: function() {
			var self = this;
			this.modules.forEach(function(module) {
				var view = self.views[module.selector];
				view.$el.addClass(module.class);
				self.row.append(view.render());
			});
		}
	});

	App.View.BottomBar = BottomBarView;
})(App, jQuery, _, Backbone);
