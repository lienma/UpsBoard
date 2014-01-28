!(function(App, $, _, Backbone) {

	var DiskSpaceView = Backbone.View.extend({
		el: 'div.diskSpacePanel',

		initialize: function() {
			this.collection = App.Disks;
			this.collection.on('add', this.addDisk, this);
		},

		addDisk: function(disk) {
			var view = new DiskSpaceDiskView({ model: disk });
			this.$('ul').append(view.render());
		}
	});
	
	var DiskSpaceDiskView = Backbone.View.extend({
		tagName: 'li',

		template: _.template($('#tmpl-panel-disk-space-li').html()),
		initialize: function() {
			var self = this;

			this.listenTo(this.model, 'change', this.update);
			this.listenTo(this.model, 'change:offline', this.updateOffline);
			this.listenTo(this.model, 'change:used', this.updateSpaceText);

			var tmpl = this.model.attributes;

			tmpl.percent = Math.round(this.model.get('used') / this.model.get('total') * 100);

			this.$el.html(this.template(tmpl)).addClass('media');

			var icon = this.model.get('icon');
			if(icon) {
				this.$('img').attr('src', App.Config.WebRoot + icon);
			}



			if(this.model.get('offline')) {
				this.updateOffline();
			} else {
				if(!App.Config.IsLoggedIn) {
					this.$('.loggedIn').hide();
					this.updateSpaceText();
				}
			}

			this.update();

		},

		updateOffline: function() {
			if(this.model.get('offline')) {
				this.$('.server-offline').show();
				this.$('.server-online').hide();
				this.$('.loggedIn').hide();

			} else {
				this.$('.server-offline').hide();
				this.$('.server-online').show();
			}
		},

		updateSpaceText: function() {
			if(App.Config.IsLoggedIn) {
				var usedSpace = this.model.get('used')
				  , totalSpace = this.model.get('total');
				this.$('.usedSpace').html(numeral(usedSpace).format('0.00 b'));
				this.$('.totalSpace').html(numeral(totalSpace).format('0.00 b'));
			}
		},

		getPercentageClass: function(percent) {
			var loadColor = '';
			if(percent >= 75 && 90 > percent) {
				loadColor = 'progress-bar-warning';
			} else if(percent>= 90) {
				loadColor = 'progress-bar-danger';
			}
			return loadColor;
		},

		update: function() {
			if(!this.model.get('offline')) {
				var total = this.model.get('total')
				  , used = this.model.get('used');

				var percent = Math.round(used / total * 100);

				this.$('.progress').attr('title', percent + '% Full').tooltip();
				var progress = this.$('.progress .progress-bar').css({width: percent + '%'});
				progress.removeClass('progress-bar-warning progress-bar-danger').addClass(this.getPercentageClass(percent));
			}
		},

		render: function() {
			return this.$el;
		}
	});

	App.View.Panel.DiskSpace = DiskSpaceView;
})(App, jQuery, _, Backbone);
