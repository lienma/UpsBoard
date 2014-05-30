define([
	'jquery', 'backbone', 'numeral',
	'tmpl!view/bottombar-item',
	'app/func/modal/multi-graph',
	'bootstrap'
], function($, Backbone, numeral, TmplBottomBar, MultiGraphModal) {

	function formatBytes(bytes) {
		return numeral(bytes).format('0.00 b');
	}

	function formatLoggedIn(num) {
		return Config.IsLoggedIn ? formatBytes(num) : num + '%';
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
			this.barProgressBuffer = $('<div/>', {title: 'Buffer', rel: 'tooltip', class: 'progress-bar progress-bar-warning'});
			this.barProgressCache = $('<div/>', {title: 'Cache', rel: 'tooltip', class: 'progress-bar'});
			this.barProgressUsed = $('<div/>', {title: 'Used', rel: 'tooltip', class: 'progress-bar progress-bar-info'});

			var divProgress = $('<div/>', {class: 'progress'}).append(this.barProgressBuffer).append(this.barProgressCache).append(this.barProgressUsed);
			this.$('.progressDiv').append(divProgress);
			this.$('[rel=tooltip]').tooltip();
		},

		setupModal: function() {
			this.modal = new MultiGraphModal({
				useSocket: true,
				socketName: 'memory',

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

				colors: Config.Colors.Memory,

				tmplTabBody: '',

				graphFields: [
					{label: 'Buffer', field: 'buffer'},
					{label: 'Cache', field: 'cache'},
					{label: 'Used', field: 'used'}
				],

				initialize: this.initializeModal.bind(this),

				initializeBody: this.initializeBody,
				tooltipLabel: this.tooltipLabel,
				yAxisFormatter: this.yAxisFormatter
			}, this.App);
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

			var loggedIn 	= Config.IsLoggedIn
			  , perTotal 	= loggedIn ? total : 100
			  , perBuffer 	= (loggedIn ? Math.floor(buffer / total * 100) : buffer) + '%'
			  , strBuffer 	= loggedIn ? formatBytes(buffer) : perBuffer
			  , perCache 	= (loggedIn ? Math.floor(cache / total * 100) : cache) + '%'
			  , strCache 	= loggedIn ? formatBytes(cache) : perCache
			  , perUsed 	= (loggedIn ? Math.floor(used / total * 100) : used) + '%'
			  , strUsed 	= loggedIn ? formatBytes(used) : perUsed;


			this.barProgressBuffer.css({width: perBuffer}).attr('data-original-title', 'Buffer: ' + strBuffer);
			this.barProgressCache.css({width: perCache}).attr('data-original-title', 'Cache: ' + strCache);
			this.barProgressUsed.css({width: perUsed}).attr('data-original-title', 'Used: ' + strUsed);

			var sum = buffer + cache + used;
			this.divDetail.html(loggedIn ? formatBytes(sum) + ' / ' + formatBytes(total) : 'Using ' + sum + '%');
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
				return !Config.IsLoggedIn ? '0%' : '0 Bytes';
			}

			return formatLoggedIn(val);
		}
	});

	return View;
});