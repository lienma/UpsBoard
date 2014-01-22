!(function(App, $, _, Backbone) {
	var View = Backbone.View.extend({
		el: '.bandwidth-data-caps',

		initialize: function() {
			App.Bandwidth.on('add', this.addServer, this);
		},

		addedServers: 0,
		totalServers: 0,

		addServer: function(server) {
			if(server.get('cap') != false) {
				var view = new ServerView({ model: server });

				if(!App.Config.IsLoggedIn) {
					view.$('.loggedIn').addClass('hidden');
				}

				this.$('ul').append(view.render());
				this.addedServers += 1;
			}

			this.totalServers += 1;
			if(App.Bandwidth.length == this.totalServers && this.addedServers == 0) {
				this.$el.hide();
			}
		}
	});

	var ServerView = Backbone.View.extend({
		tagName: 'li',

		template: _.template($('#tmpl-panel-data-cap-li').html()),
		initialize: function() {
			var self = this;

			var tmpl = this.model.attributes;
			tmpl.percent = Math.round(this.model.get('cap') / this.model.get('capLimit') * 100);
			this.$el.html(this.template(tmpl)).addClass('media');

			this.listenTo(this.model, 'change:cap', this.update);
			this.update();
		},

		getPercentageClass: function(percent) {
			var color = '';
			if(percent < 21) {
				color = '-success';
			} else if(percent < 41) {
				color = '-info';
			} else if(percent < 61) {
				color = '';
			} else if(percent < 86) {
				color = '-warning';
			} else {
				color = '-danger'
			}
			return 'progress-bar' + color;
		},

		update: function() {
			var limit = this.model.get('capLimit')
			  , used = this.model.get('cap');

			this.$('.used').html((App.Config.IsLoggedIn) ? numeral(used).format('0 b') : used);
			this.$('.limit').html((App.Config.IsLoggedIn) ? numeral(limit).format('0 b') : limit);

			var percent = Math.round(used / limit * 100);

			this.$('.progress').attr('title', percent + '% Used').tooltip();
			var progress = this.$('.progress .progress-bar').css({width: percent + '%'});
			progress.removeClass('progress-bar-warning progress-bar-danger progress-bar-success progress-bar-info').addClass(this.getPercentageClass(percent));
		},

		render: function() {
			return this.$el;
		}
	});

	App.View.Panel.DataCap = View;
})(App, jQuery, _, Backbone);
