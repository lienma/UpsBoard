define([
	'backbone', 'numeral',

	'tmpl!view/sabnzbd/bottombar',

	'app/view/panel/sabnzbd/bottombar/remainspace'
], function(Backbone, numeral, Tmplbar, ViewRemainSpace) {

	var View = Backbone.View.extend({

		events: {
			'click .list-btn.btn-queue': 'switchToQueue',
			'click .list-btn.btn-history': 'switchToHistory'
		},

		initialize: function(options) {
			this.sabnzbd = options.sabnzbd;

			this.buildView();

			this.QueueList = this.sabnzbd.Lists.Queue;
			this.HistoryList = this.sabnzbd.Lists.History;

			this.$btnQueue = this.$('.list-btn.btn-queue');
			this.$btnHistory = this.$('.list-btn.btn-history');

			this.sabnzbd.onload(this.slideIn, this);

			this.listenTo(this.model, 'change:noofslots', this.updateNumOfSlots);
			this.listenTo(this.model, 'change:slots', this.updateNumOfSlots);
		},

		buildView: function() {
			this.$el.html(Tmplbar()).hide();

			this.space = new ViewRemainSpace({model: this.model});

			this.$('.remaining-space').html(this.space.render());

			this.$('[rel=tooltip]').tooltip();
		},

		render: function() {
			return this.$el;
		},

		slideIn: function() {
			this.$el.slideDown();
		},

		switchToHistory: function(event) {
			if(this.QueueList.isActive()) {
				this.$btnHistory.addClass('active');
				this.$btnQueue.removeClass('active');

				this.HistoryList.activate();
				this.QueueList.deactivate();
			}
		},

		switchToQueue: function(event) {
			if(this.HistoryList.isActive()) {
				this.$btnQueue.addClass('active');
				this.$btnHistory.removeClass('active');

				this.QueueList.activate();
				this.HistoryList.deactivate();
			}
		},

		updateNumOfSlots: function() {
			var showing = this.model.get('slots').length
			  , total = parseInt(this.model.get('noofslots'));

			var format = function(num) {
				return numeral(num).format('0,0');
			};

			var output = (showing == total) ? format(total) : format(showing) + ' <span class="small">of</span> ' + format(total);

			this.$('.nzbs-in-queue').html(output);
		},

		historyLoadingIconShow: function() {
			this.$('.loading-history-icon').fadeIn(200);
		},

		historyLoadingIconHide: function() {
			this.$('.loading-history-icon').fadeOut(200);
		}
	});

	return View;
});
