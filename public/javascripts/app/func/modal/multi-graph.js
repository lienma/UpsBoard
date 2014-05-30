define([
	'jquery', 'underscore', 'backbone',
	'app/func/modal/config',
	'app/func/modal/defaults',
	'tmpl!view/modal/multi',
	'tmpl!view/modal/multi-item',
	'jquery.flot', 'jquery.flot.time'

], function($, _, Backbone, mConfig, mDefaults, TmplGraphMulti, TmplGraphMultiItem) {

	function Modal(options, App) {
		this.id					= Config.IdCount++;

		this.App				= App;
		this.activePanel		= {};
		this.graphHistory		= {};
		this.graphItems			= [];
		this.modalOpened		= false;
		this.hasBuiltTabs		= false;
		this.previousTooltip	= null;
		this.panels				= {};

		this.options 			= _.defaults(options, mDefaults);

		this.createElement();

		this.$ 					= function(query) { return this.$el.find(query); };

		this.setupCollection();
	}

	Modal.prototype.createElement = function() {
		this.$el = $(TmplGraphMulti({ title: this.options.collectionModel.get('mTitle') }));
		$('body').append(this.$el);
	};

	Modal.prototype.addTab = function(model) {
		if(this.options.useSocket) {
			this.App.Socket.on(this.options.socketName + ':' + model.id, function(data) {
				model.set(data);
			}.bind(this));
		}

		var panel = new PanelView({
			model: model,
			modalId: this.id,
			graphItems: this.options.graphFields,
			regularGraph: this.options.regularGraph,
			tooltipLabel: this.options.tooltipLabel,
			colors: this.options.colors,
			yAxisFormatter: this.options.yAxisFormatter,
			tmplTabBody: this.options.tmplTabBody,

			modal: this
		});

		this.panels[model.id] = panel;

		var tab = panel.renderLink();
		tab.on('show.bs.tab', function(e) {
			this.activePanel = panel;
		}.bind(this));

		this.$('ul.nav-tabs').append(tab);
		this.$('.tab-content').append(panel.render());

		this.options.initializeBody.call(panel, model);
	};

	Modal.prototype.buildTabs = function() {
		if(this.collection.size() == 1) {
			this.$('ul.nav-tabs').hide();
		}
		
		this.collection.each(function(model) {
			this.addTab(model);
		}.bind(this));

		this.options.initialize.call(this, this.collection);
		this.hasBuiltTabs = true;
	};

	Modal.prototype.fetch = function() {
		var base = this;
		this.collection.fetch({success: function() {
			if(!App.Config.StopUpdating) {
				base.fetch();
			}
		}});
	};

	Modal.prototype.setupCollection = function() {

		var Model = Backbone.Model.extend({
			idAttribute: 	'_id',
			defaults: 		this.options.modelDefaults,
			modalGraph: 	null,
			modalTab: 		null,
			modalPanel: 	null
		});

		var collectionUrl = this.options.url ? this.options.url : false;
		var Collection = Backbone.Collection.extend({
			model: Model,
			url: collectionUrl,
	
			getDefaultModel: function() {
				var model = this.findWhere({default: true});
				return model;
			}
		});

		this.collection = new Collection();
		this.setupModalEvents();

		if(collectionUrl) {
			this.collection.fetch({success: function() {
				if(this.collection.size() == 1) {
					this.$('ul.nav-tabs').hide();
				}
	
				this.collection.each(function(model) {
					this.addTab(model);
				}.bind(this));

				this.options.initialize.call(this, this.collection);
	
				if(!Config.StopUpdating) {
					this.fetch();
				}
			}.bind(this)});
		} else if(this.options.useSocket) {
			this.App.Socket.on(this.options.socketName, function(data) {
console.log('get', this.options.socketName, data);
				this.collection.set(data);

				if(!this.hasBuiltTabs) {
					this.buildTabs();
				}
			}.bind(this));
		} else {
			this.options.collectionModel.on('change:collection', function(model) {
				this.collection.set(model.get('collection'));
			}, this);

			this.options.collectionModel.once('change:collection', function(model) {
				this.buildTabs();
			}, this);
		}
	};

	Modal.prototype.setupModalEvents = function() {

		this.$el.on('shown.bs.modal', function () {
			this.modalOpened = true;
			this.activePanel = this.panels['1'];
			this.activePanel.buildGraph();
		}.bind(this)).on('hide.bs.modal', function () {
			this.modalOpened = false;
		}.bind(this));
	};
	
	Modal.prototype.open = function() {
		this.$el.modal();
	};


	var PanelView = Backbone.View.extend({
		template: TmplGraphMultiItem,

		events: {
			'click .close-alert': 'closeAlert'
		},

		initialize: function(args) {
			this.modalId	= args.modalId;
			this.graphItems = args.graphItems;
			this.regularGraph = args.regularGraph;
			this.tooltipLabel = args.tooltipLabel;
			this.showTooltip = args.showTooltip;
			this.colors = args.colors;
			this.yAxisFormatter = args.yAxisFormatter;

			this.modal = args.modal;


			var label = this.model.get('label'), id = this.model.id;
			var paneId = 'paneId-' + this.modalId + '-' + id;

			this.$el.attr('id', paneId);
			this.$el.addClass('tab-pane fade');

			if(this.model.get('default')) {
				this.$el.addClass('in active').tab('show');
			}

			this.link = $('<a/>', {'data-toggle':'tab', href:'#' + paneId}).text(label);		
			this.link.on('shown.bs.tab', this.show.bind(this));

			var tmplBody = _.isString(args.tmplTabBody) ? _.template(args.tmplTabBody) : args.tmplTabBody;

			this.$el.html(this.template()).find('.graphModalBody').append(tmplBody(this.model.attributes));

			this.buildCurrent();
			this.buildHistory();

			this.$('.chart-container').bind('plothover', this.plotHoverEvent.bind(this));

			this.listenTo(this.model, 'change', this.addHistory);
		},

		addHistory: function(model) {
			var runningSum = 0, time = new Date().getTime();

			this.graphItems.forEach(function(item) {
				var data = model.get(item.field);
				runningSum += parseFloat(data);

				this.history[item.field].push({
					plot: (this.regularGraph) ? data : runningSum,
					data: data,
					time: time
				});

				if(this.history[item.field].length > mConfig.historyLimit) {
					this.history[item.field].shift();
				}
			}.bind(this));
			this.updateGraph();
		},

		buildCurrent: function() {
			var current = this.$('.current .online');

			this.graphItems.forEach(function(item) {
				current.append($('<strong />').html(item.label + ': '));
				current.append($('<span />').addClass(item.field));
			});
		},

		buildGraph: function() {
			if(this.graph == null) {
				var width = this.$el.width();
				this.$('.chart-container').css({
					width: width + 'px',
					height: Math.round(width / 2.8) + 'px'
				});

				this.graph = this.$('.chart-container').plot(this.getDataPoints(), {
					yaxis: { min: 0, tickFormatter: this.yAxisFormatter },
					grid: { hoverable: true },
					xaxis: { mode: 'time', timezone: 'browser' },
					legend: {
						container : this.$('.chart-legend'),
						noColumns : this.graphItems.length
					}
				}).data('plot');
			} else {
				this.updateGraph();
			}
		},

		buildHistory: function() {
			this.history = {};
			this.graphItems.forEach(function(item) {
				this.history[item.field] = [];
			}.bind(this));

			this.addHistory(this.model);
		},

		closeAlert: function() {
			this.$('.alertBackground').hide();
		},

		getDataPoints: function() {
			var dataArray = [];

			this.graphItems.forEach(function(item) {
				dataArray.push(this.getHistory(item));
			}.bind(this));
			return dataArray;
		},

		getHistory: function(item) {
			var historyArray = [];
			var history = this.history[item.field];

			var size = history.length;
			if(size < mConfig.graphLimit + 1) {
				var left = mConfig.graphLimit - size;
				var startTime = (history[0]) ? history[0].time : new Date().getTime();

				for(var i = 0; i < left; i++) {
					var time = startTime - (1000 * (left - i) * 5);
					historyArray.push([time, 0]);
				}

				var y = 0;
				for(var i = left; i < mConfig.graphLimit; i++) {
					historyArray.push([history[y].time, history[y].plot]);
					y += 1;
				}
			} else {
				for(var i = size - mConfig.graphLimit; i < size; i++) {
					historyArray.push([history[i].time, history[i].plot]);
				}	
			}
			return {data: historyArray, field: item.field, label: item.label, color: this.colors[item.field].border,
				lines: {
					fill: false
				}
			};
		},

		renderLink: function() {
			var tab = $('<li />').addClass((this.model.get('default')) ? 'active' : '');

			return tab.append(this.link);
		},

		render: function() {
			return this.$el;
		},

		plotHoverEvent: function(event, pos, item) {
			if(item) {
				if(this.previousTooltip != item) {
					this.previousTooltip = item;
					$('.chartTooltip').remove();

					var type = this.history[item.series.field];

					var pos = -1;
					for(var i = 0; i < type.length; i++) {
						if(type[i].time == item.datapoint[0]) {
							pos = i;
						}
					}

					var data = (pos == -1) ? 'No data' : this.tooltipLabel(type[pos]);

					if(pos != -1) {
						function addZero(num) {
							return (num < 10) ? '0' + num : num;
						}
						var d = new Date(type[pos].time);
						var timeStr = d.getHours() + ':' + addZero(d.getMinutes()) + ':' + addZero(d.getSeconds());
						data = data.replace('%time%', timeStr);
					}

					var contents = '<strong>' + item.series.label + '</strong>: ' + data
					  , colors = this.colors[item.series.field];


					$('<div/>').addClass('chartTooltip').html(contents).css({
						top: item.pageY + 5,
						left: item.pageX + 5,
						'border-color':  colors.border,
						'background-color': colors.bg,
						opacity: 0.9
					}).appendTo('body').fadeIn(200);
				}
			} else {
				$('.chartTooltip').remove();
				this.previousTooltip = null;            
			}
		},

		setupOfflineMsg: function() {
			var alert = this.$('.alert-background')
			  , divOffline = this.$('.current .offline')
			  , divOnline = this.$('.current .online');

			function offlineMsg(offline) {
				alert[(offline) ? 'show' : 'hide']();
				divOffline[(offline) ? 'show' : 'hide']();
				divOnline[(!offline) ? 'show' : 'hide']();
			}

			offlineMsg(this.model.get('offline'));
			this.model.on('change:offline', function(m) {
				offlineMsg(m.get('offline'));
			});
		},

		show: function(event) {
			this.buildGraph();
		},

		isActive: function() {
			return (this.modal.activePanel == this);
		},

		updateGraph: function() {
			if(this.modal.modalOpened && this.isActive()) {
				var data = this.getDataPoints();

				this.graph.setData(data);
				this.graph.setupGrid();
				this.graph.draw();
			}
		}
	});

	return Modal;
});