define([
	'jquery', 'backbone',
	'app/model/sabnzbd/queue',
	'app/view/panel/sabnzbd/topbar',
	'app/view/panel/sabnzbd/lists',
	'app/view/panel/sabnzbd/bottombar',
	'bootstrap'
], function($, Backbone, QueueModel, Topbar, ListsView, Bottombar) {

	var Model = Backbone.Model.extend({
		defaults: {
			loaded: false
		}
	});

	var View = Backbone.View.extend({
		el: '.panel.sabnzbd',
		enabled: false,



		initialize: function() {
			if(!Config.CanUse.SABnzbd) return;

			this.panel = new Model();

			this.data = new QueueModel('queue');
			this.history = new QueueModel('history');

			this.Lists = new ListsView({model: this.data, sabnzbd: this, el: this.$('.panel-body')});

			this.Topbar = new Topbar({sabnzbd: this, panel: this.panel, lists: this.Lists, model: this.data});
			this.Bottombar = new Bottombar({sabnzbd: this, model: this.data});

			this.data.start().then(this.buildView.bind(this)).fail(this.failed.bind(this));
		},

		failed: function() {
console.log('Failed');
		},

		buildView: function() {
			this.loaded();

			this.$('.sabnzbd-topbar').html(this.Topbar.render());
			this.$('.panel-footer').html(this.Bottombar.render()).show();
return;
			new ListsView({ model: this.status, history: this.history, el: this.$el });
		},

		loaded: function() {
			if(!this.panel.get('loaded')) {
				this.panel.set('loaded', true);
				this.panel.trigger('loaded');
			}
		},

		isLoaded: function() {
			return this.panel.get('loaded')
		},

		onload: function(func, that) {
			if(this.panel.get('loaded')) {
				func.call(that);
			} else {
				this.panel.once('loaded', func, that);
			}
		}
	});

	return View;
});