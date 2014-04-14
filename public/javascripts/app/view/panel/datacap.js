define([
	'backbone',
	'app/view/panel/datacap/item'
], function(Backbone, ServerView) {

	var View = Backbone.View.extend({
		el: '.bandwidth-data-caps',

		initialize: function(App) {
			this.servers = App.Collections.Bandwidth;
			this.servers.on('add', this.addServer, this);
		},

		addedServers: 0,
		totalServers: 0,

		addServer: function(server) {
			if(server.get('cap') != false) {
				var view = new ServerView({ model: server });

				if(!Config.IsLoggedIn) {
					view.$('.loggedIn').addClass('hidden');
				}

				this.$('ul').append(view.render());
				this.addedServers += 1;
			}

			this.totalServers += 1;
			if(this.servers.length == this.totalServers && this.addedServers == 0) {
				this.$el.hide();
			}
		}
	});

	return View;
});