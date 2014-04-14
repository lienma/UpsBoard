define([
	'backbone',

	'tmpl!view/sabnzbd/topbar',
	'app/view/panel/sabnzbd/topbar/timeleft',
	'app/view/panel/sabnzbd/topbar/pausebutton',
	'app/view/panel/sabnzbd/topbar/speed',
	'app/view/panel/sabnzbd/topbar/addnzb',

], function(Backbone, Tmplbar, TimeLeftView, PauseButtonView, SpeedView, AddNzbView) {

	var View = Backbone.View.extend({

		events: {
			'click .add-nzb': 'clickAddNzb'
		},

		initialize: function() {

			this.buildView();
		},

		buildView: function() {
			this.$el.html(Tmplbar());

			new PauseButtonView({ model: this.model, el: this.$('.puase-downloading') });
			new TimeLeftView({ model: this.model, el: this.$('.time-left .time') });
			new SpeedView({ model: this.model, el: this.$('.downloading-speed') });
			new AddNzbView({ model: this.model, el: this.$('.add-nzb') });


			$(this.$el.find('[rel=tooltip]')).tooltip();
		},

		clickAddNzb: function(event) {
			this.$('.modal-add-nzb').modal();
		},

		render: function() {
			return this.$el;
		}
	});

	return View;
});