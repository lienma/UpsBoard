!(function(App, $, _, Backbone) {

	function formatBytes(bytes) {
		return numeral(bytes).format('0.00 b');
	}

	var View = Backbone.View.extend({
		loading: true,

		template: _.template($('#tmpl-bottom-display-item').html()),

		initialize: function() {
			var self = this;
			this.$el.addClass('pointer').html(this.template(this.model.attributes));

			this.setupBar();
			this.setupModal();
			App.Bandwidth = this.modal.collection;

			this.$el.click(function() {
				if(!this.loading) {
					this.modal.open();
				}
			}.bind(this));
		},

		setupBar: function() {
			this.detailDiv = this.$('.detail');
			this.progressBarDown = $('<div/>', {class: 'progress-bar'});
			this.progressBarUp = $('<div/>', {class: 'progress-bar progress-bar-warning'});

			var downloadDiv = $('<div/>', {title: 'Download', class: 'progress bandwidth pull-left'}).append(this.progressBarDown).tooltip();
			var uploadDiv = $('<div/>', {title: 'Upload', class: 'progress bandwidth pull-right'}).append(this.progressBarUp).tooltip();
			this.$('.progressDiv').append(downloadDiv).append(uploadDiv);
		},

		setupModal: function() {
			var base = this;
			function fieldBandwidth(body, field) {
				return function(model) {
					body.$('.' + field + 'Download').text(formatBytes(model.get(field)[0]));
					body.$('.' + field + 'Upload').text(formatBytes(model.get(field)[1]));
					body.$('.' + field + 'Total').text(formatBytes(model.get(field)[2]));
				};
			}

			this.modal = new App.Modal.GraphMulti({
				el: $('#modal-multi-bandwidth'),
				collectionModel: this.model,

				modelDefaults: {
					label: '',
					default: false,
					max: [0, 0],
					offline: false,

					dateSince: '',
		
					download: 0,
					upload: 0,
		
					total: [0, 0, 0],
					lastMonth: [0, 0, 0],
					thisMonth: [0, 0, 0],
					today: [0, 0, 0]
				},

				regularGraph: true,
				colors: App.Config.Bandwidth,

				tmplTabBody: $('#tmpl-modal-bandwidth').html(),

				graphFields: [{label: 'Download', field: 'download'}, {label: 'Upload', field: 'upload'}],


				initialize: function(collection) {
					var model = collection.getDefaultModel();
					model.on('change', base.updateBar, base);
					base.updateBar(model);

					base.$('.itemTooltip').attr('title', 'Click for more information').tooltip();
					base.loading = false;
				},

				initializeBody: function(model) {
					this.setupOfflineMsg();

					['download', 'upload'].forEach(function(field) {
						this.$('.current .' + field).text(model.get(field) + ' Mbps');
					}.bind(this));

					model.on('change:download change:upload', function(m) {
						this.$('.current .download').text(m.get('download') + ' Mbps');
						this.$('.current .upload').text(m.get('upload') + ' Mbps');
					}, this);

					if(App.Config.IsLoggedIn) {
						this.$('.not-logged-in').hide();
						['lastMonth', 'thisMonth', 'today', 'total'].forEach(function(field) {
							var editField = fieldBandwidth(this, field);

							editField(model);
							model.on('change:' + field, editField, this);
						}.bind(this));
					} else {
						this.$('.logged-in').hide();
					}
				},

				tooltipLabel: function(data) {
					return data.data + ' Mbps<br /><small>at %time%</small>';
				},

				yAxisFormatter: function(val, axis) {
					if(val == 0) {
						return '0 Mbps';
					}

					val = Math.round(val * 100) / 100

					return val + ' Mbps';
				}
			});
		},

		updateBar: function(model) {
			var download = model.get('download')
			  , max = model.get('max')
			  , upload = model.get('upload');

			this.progressBarDown.css({width: Math.floor(download / max[0] * 100) + '%'});
			this.progressBarUp.css({width: Math.floor(upload / max[1] * 100) + '%'});
			this.detailDiv.html(download + ' Mbps / ' + upload + ' Mbps');
		},

		render: function() {
			return this.$el;
		}
	});

	App.View.BottomBar.Bandwidth = View;
})(App, jQuery, _, Backbone);
