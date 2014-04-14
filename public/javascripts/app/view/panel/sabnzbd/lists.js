define([
	'jquery', 'backbone',

	'tmpl!view/sabnzbd/lists',

	'app/view/panel/sabnzbd/lists/queue',
	'app/view/panel/sabnzbd/lists/history'

], function($, Backbone, TmplLists, QueueView, HistoryView) {

	var View = Backbone.View.extend({

		initialize: function(options) {
			this.sabnzbd = options.sabnzbd;

			this.$el.html(TmplLists());

			this.Queue = new QueueView({el: this.$('.list-queue'), model: this.model, body: this.$el, sabnzbd: this.sabnzbd});
			this.History = new HistoryView({el: this.$('.list-history'), model: this.sabnzbd.history, body: this.$el, sabnzbd: this.sabnzbd});

			this.sabnzbd.onload(this.hideLoadingMsg, this);

		},

		hideLoadingMsg: function() {
			this.$('.panel-loading').fadeOut(function() {
				this.Queue.$el.fadeIn(function() {
					this.Queue.resize();
				}.bind(this));
			}.bind(this));
		},

		render: function() {
			return this.$el;
		}
	});

	return View;
});
