!(function(App, $, _, Backbone) {
	var Model = Backbone.Model.extend({
		idAttribute: '_id'
	});
	var Collection = Backbone.Collection.extend({
		model: Model,
		url: App.Config.WebRoot + '/stats/services'
	});

	var ServicesView =  Backbone.View.extend({
		el: '.panel.servicesStatusPanel',

		initialize: function() {
			var base = this;

			this.collection = new Collection();
			this.collection.on('add', this.addService, this);

			this.collection.fetch();
			setInterval(function() {
				if(!App.Config.StopUpdating) {
					base.collection.fetch();
				}
			}, App.Config.UpdateDelay);
		},

		addService: function(service) {
			var view = new ServicesItemView({ model: service });
			this.$('table').append(view.render());
		},

		render: function() {
			return this.$el;
		}
	});

	var ServicesItemView = Backbone.View.extend({
		tagName: 'tr',
		template: _.template($('#tmpl-panel-service-item').html()),

		initialize: function() {
			this.listenTo(this.model, 'change', this.update);
			this.$el.html(this.template(this.model.attributes));


			//this.$el.addClass('service').attr('title', this.model.get('label')).tooltip();
			if(this.model.get('url')) {
				this.$('a.btn').attr('href', this.model.get('url'));
			} else {
				this.$('a.btn').addClass('disabled');
			}
		
			this.update();	
		},

		update: function() {
			var isOnline = this.model.get('online');

			var statusIcon = (isOnline) ? 'glyphicon-ok' : 'glyphicon-remove'
			  , statusBtn = (isOnline) ? 'btn-success' : 'btn-warning';

			this.$('i.glyphicon').removeClass('glyphicon-ok glyphicon-remove').addClass(statusIcon);

			this.$('a.btn.btn-xs').removeClass('btn-success btn-warning').addClass(statusBtn);

			if(this.model.get('url')) {
				if(isOnline) {
					this.$('a.btn.btn-xs').removeClass('disabled');
				} else {
					this.$('a.btn.btn-xs').addClass('disabled');
				}
			}
		},

		render: function() {
			return this.$el;
		}
	});

	App.View.Panel.Services = ServicesView;
})(App, jQuery, _, Backbone);
