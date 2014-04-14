define([
	'jquery', 'backbone', 'numeral',
	'tmpl!view/bottombar-item',
	'app/func/modal/multi-graph',
	'tmpl!view/modal/bandwidth',
	'bootstrap'
], function($, Backbone, numeral, TmplBottomBar, MultiGraphModal, TmplModalBandwidth) {

	function formatBytes(bytes) {
		return numeral(bytes).format('0.00 b');
	}

	var View = Backbone.View.extend({
		template: TmplBottomBar,

		loading: true,

		initialize: function(obj, App) {
			this.App = App;

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
			this.divDetail = this.$('.detail');
			this.barProgressDown = $('<div/>', {class: 'progress-bar'});
			this.barProgressUp = $('<div/>', {class: 'progress-bar progress-bar-warning'});

			var divDownload = $('<div/>', {title: 'Download', class: 'progress bandwidth pull-left'}).append(this.barProgressDown).tooltip();
			var divUpload = $('<div/>', {title: 'Upload', class: 'progress bandwidth pull-right'}).append(this.barProgressUp).tooltip();
			this.$('.progressDiv').append(divDownload).append(divUpload);
		},

		setupModal: function() {
			this.modal = new MultiGraphModal({
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
				colors: Config.Colors.Bandwidth,

				tmplTabBody: TmplModalBandwidth,

				graphFields: [{label: 'Download', field: 'download'}, {label: 'Upload', field: 'upload'}],

				initialize: this.initializeModal.bind(this),
				initializeBody: this.initializeBody,
				tooltipLabel: this.tooltipLabel,
				yAxisFormatter: this.yAxisFormatter
			});
		},

		updateBar: function(m) {
			var download = m.get('download'), max = m.get('max'), upload = m.get('upload');

			this.barProgressDown.css({width: Math.floor(download / max[0] * 100) + '%'});
			this.barProgressUp.css({width: Math.floor(upload / max[1] * 100) + '%'});
			this.divDetail.html(download + ' Mbps / ' + upload + ' Mbps');
		},

		render: function() {
			return this.$el;
		},


		initializeModal: function(collection) {
			var model = collection.getDefaultModel();
			this.listenTo(model, 'change', this.updateBar);
			this.updateBar(model);

			this.$('.itemTooltip').attr('title', 'Click for more information').tooltip();
			this.loading = false;

			this.App.Collections.Bandwidth.set(collection.models);
			this.listenTo(collection, 'change', function(m) {
				this.App.Collections.Bandwidth.set(m.collection.models);
			}.bind(this));
		},

		initializeBody: function(model) {
			function fieldBandwidth(body, field) {
				return function(model) {
					body.$('.' + field + 'Download').text(formatBytes(model.get(field)[0]));
					body.$('.' + field + 'Upload').text(formatBytes(model.get(field)[1]));
					body.$('.' + field + 'Total').text(formatBytes(model.get(field)[2]));
				};
			}

			this.setupOfflineMsg();

			['download', 'upload'].forEach(function(field) {
				this.$('.current .' + field).text(model.get(field) + ' Mbps');
			}.bind(this));

			model.on('change:download change:upload', function(m) {
				this.$('.current .download').text(m.get('download') + ' Mbps');
				this.$('.current .upload').text(m.get('upload') + ' Mbps');
			}, this);

			if(Config.IsLoggedIn) {
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

	return View;
});