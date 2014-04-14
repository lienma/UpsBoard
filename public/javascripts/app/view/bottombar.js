define([
	'backbone',

	'app/view/bottombar/bandwidth',
	'app/view/bottombar/cpu',
	'app/view/bottombar/memory',
	'app/view/bottombar/space'

], function(Backbone, BandwidthView, CpuView, MemoryView, SpaceView) {


	var Model = Backbone.Model.extend({
		idAttribute: 'selector'
	});

	var View = Backbone.View.extend({
		el: 'div.bottom-display-bar',
		ul: null,

		views: {},

		initialize: function(App) {
			this.App = App;
			this.row = this.$('div.row');
			this.model = App.Models.ServerStats;

			this.Modules = [{
					'selector': 'Cpu',
					'title': 'CPU',
					'mTitle': 'Processor Information',
					'class': 'col-md-3',
					'needServerModel': true,
					'view': CpuView
				}, {
					'selector': 'Memory',
					'title': 'Memory',
					'mTitle': 'Memory History & Information',
					'class': 'col-md-3',
					'needServerModel': true,
					'view': MemoryView
				}, {
					'selector': 'Bandwidth',
					'title': 'Bandwidth',
					'mTitle': 'Bandwidth History & Information',
					'class': 'col-md-3',
					'needServerModel': true,
					'view': BandwidthView
				}, {
					'selector': 'Space',
					'title': 'Total Space',
					'class': 'col-md-3',
					'needServerModel': false,
					'drivesModel': App.Models.Drives,
					'view': SpaceView
				}];


			this.buildModules();
			this.render();

			this.updateHeight();
			$(window).on('resize', this.updateHeight.bind(this));
		},

		buildModules: function() {

			this.Modules.forEach(function(module) {
				var moduleName = module.selector
				  , model = new Model(module);

				this.views[moduleName] = new module.view({ model: model }, this.App);

				if(module.needServerModel) {
					this.listenTo(this.model, 'change:' + moduleName, function(m) {
						var model = m.get(moduleName);

						if(_.isArray(model)) {
							model = {collection: model};
						}

						this.views[moduleName].model.set(model);
					}, this);
				}
			}.bind(this));
		},

		render: function() {
			this.Modules.forEach(function(module) {
				var view = this.views[module.selector];
				view.$el.addClass(module.class);
				this.row.append(view.render());
			}.bind(this));
		},

		updateHeight: function() {
			$('.bottom-bar-padding').css({height: this.$el.height() + 'px'});
		}
	});


	return View;
});
