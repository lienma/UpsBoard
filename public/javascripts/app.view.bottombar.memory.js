!(function(App, $, _, Backbone) {

	function formatBytes(bytes) {
		return numeral(bytes).format('0.00 b');
	}

	function formatLoggedIn(num) {
		return App.Config.IsLoggedIn ? formatBytes(num) : num + '%';
	}

	var View = Backbone.View.extend({
		template: _.template($('#tmpl-bottom-display-item').html()),

		loading: true,

		initialize: function() {
			this.$el.addClass('pointer').html(this.template(this.model.attributes));

			this.setupBar();
			this.setupModal();

			this.$el.click(function() {
				if(!this.loading) {
					this.modal.open();
				}
			}.bind(this));
		},

		setupBar: function() {
			this.detailDiv = this.$('.detail');
			this.progressBarBuffer = $('<div/>', {title: 'Buffer', rel: 'tooltip', class: 'progress-bar progress-bar-warning'});
			this.progressBarCache = $('<div/>', {title: 'Cache', rel: 'tooltip', class: 'progress-bar'});
			this.progressBarUsed = $('<div/>', {title: 'Used', rel: 'tooltip', class: 'progress-bar progress-bar-info'});

			var progressDiv = $('<div/>', {class: 'progress'}).append(this.progressBarBuffer).append(this.progressBarCache).append(this.progressBarUsed);
			this.$('.progressDiv').append(progressDiv);
			this.$('[rel=tooltip]').tooltip();
		},

		setupModal: function() {
			var self = this;

			this.modal = new App.Modal.GraphMulti({
				el: $('#modal-multi-memory'),
				collectionModel: this.model,

				modelDefaults: {
					label: '',
					default: false,
					offline: false,

					free: 0,
					buffer: 0,
					cache: 0,
					used: 0
				},

				colors: App.Config.Memory,

				tmplTabBody: "",

				graphFields: [
					{label: 'Buffer', field: 'buffer'},
					{label: 'Cache', field: 'cache'},
					{label: 'Used', field: 'used'}
				],

				initialize: function(collection) {
					var model = collection.getDefaultModel();
					model.on('change', self.updateBar, self);
					self.updateBar(model);

					self.$('.itemTooltip').attr('title', 'Click for more information').tooltip();
					self.loading = false;
				},

				initializeBody: function(model) {
					this.setupOfflineMsg();

					['buffer', 'cache', 'used'].forEach(function(field) {
						this.$('.current .' + field).text(formatLoggedIn(model.get(field)));
					}.bind(this));

					model.on('change:buffer change:cache change:used', function(m) {
						this.$('.current .buffer').text(formatLoggedIn(m.get('buffer')));
						this.$('.current .cache').text(formatLoggedIn(m.get('cache')));
						this.$('.current .used').text(formatLoggedIn(m.get('used')));
					}, this);
				},

				tooltipLabel: function(data) {
					var bytes = formatLoggedIn(data.data);
					return bytes + '<br /><small>at %time%</small>';
				},

				yAxisFormatter: function(val, axis) {
					if(val == 0) {
						return !App.Config.IsLoggedIn ? '0%' : '0 Bytes';
					}

					return formatLoggedIn(val);
				}
			});
		},

		updateBar: function(model) {
			if(this.loading) {
				this.$('.itemTooltip').attr('title', 'Click for more information').tooltip();
				this.loading = false;
			}

			var total 		= model.get('total')
			  , buffer 		= model.get('buffer')
			  , cache 		= model.get('cache')
			  , used 		= model.get('used');

			var loggedIn 	= App.Config.IsLoggedIn
			  , perTotal 	= loggedIn ? total : 100
			  , perBuffer 	= (loggedIn ? Math.floor(buffer / total * 100) : buffer) + '%'
			  , strBuffer 	= loggedIn ? formatBytes(buffer) : perBuffer
			  , perCache 	= (loggedIn ? Math.floor(cache / total * 100) : cache) + '%'
			  , strCache 	= loggedIn ? formatBytes(cache) : perCache
			  , perUsed 	= (loggedIn ? Math.floor(used / total * 100) : used) + '%'
			  , strUsed 	= loggedIn ? formatBytes(used) : perUsed;


			this.progressBarBuffer.css({width: perBuffer}).attr('data-original-title', 'Buffer: ' + strBuffer);
			this.progressBarCache.css({width: perCache}).attr('data-original-title', 'Cache: ' + strCache);
			this.progressBarUsed.css({width: perUsed}).attr('data-original-title', 'Used: ' + strUsed);

			var sum = buffer + cache + used;
			this.detailDiv.html(loggedIn ? formatBytes(sum) + ' / ' + formatBytes(total) : 'Using ' + sum + '%');
		},

		render: function() {
			return this.$el;
		}
	});


	App.View.BottomBar.Memory = View;
})(App, jQuery, _, Backbone);
