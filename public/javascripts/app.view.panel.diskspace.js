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

			this.model.on('change:used', this.updateSpaceText.bind(this));

			var tmpl = this.model.attributes;
			tmpl.percent = Math.round(this.model.get('used') / this.model.get('total') * 100);
			this.$el.html(this.template(tmpl)).addClass('media');

			var icon = this.model.get('icon');
			if(icon) {
				this.$('img').attr('src', App.Config.WebRoot + icon);
			}

			this.update();
			this.updateSpaceText();
		},

		updateSpaceText: function() {
			var usedSpace = this.model.get('used')
			  , totalSpace = this.model.get('total');
			this.$('.usedSpace').html(numeral(usedSpace).format('0.00 b'));
			this.$('.totalSpace').html(numeral(totalSpace).format('0.00 b'));
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
			var total = this.model.get('total')
			  , used = this.model.get('used');

			var percent = Math.round(used / total * 100);

			this.$('.progress').attr('title', percent + '% Full').tooltip();
			var progress = this.$('.progress .progress-bar').css({width: percent + '%'});
			progress.removeClass('progress-bar-warning progress-bar-danger').addClass(this.getPercentageClass(percent));
		},

		render: function() {
			return this.$el;
		}
	});

	App.View.Panel.DiskSpace = DiskSpaceView;
})(App, jQuery, _, Backbone);
