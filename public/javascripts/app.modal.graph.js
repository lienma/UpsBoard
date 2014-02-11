!(function(App, $, _, Backbone) {
	var config = {
		graphLimit: 120,
		historyLimit: 240
	};

	var defaultOptions = {
		url: '',
		modelDefaults: {},

		regularGraph: false,
		colors: {},
		tmplTabBody: null,

		graphFields: [],

		initialize: function() {

		},

		update: function() {

		},

		tooltipLabel: function(item) {
			return item.data;
		},

		yAxisFormatter: function(val, axis) {
			return val;
		}
	};

	var modalId = 0;

	var PanelView = Backbone.View.extend({
		template: template = _.template($('#tmpl-modal-graph-multi').html()),

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


			var label = this.model.get('label'), id = this.model.id;
			var paneId = 'paneId-' + this.modalId + '-' + id;

			this.$el.attr('id', paneId);
			this.$el.addClass('tab-pane fade');

			if(this.model.get('default')) {
				this.$el.addClass('in active').tab('show');
			}

			this.link = $('<a/>', {'data-toggle':'tab', href:'#' + paneId}).text(label);		
			this.link.on('shown.bs.tab', this.show.bind(this));

			var tmplBody = _.template(args.tmplTabBody);

			this.$el.html(this.template()).find('.graphModalBody').append(tmplBody(this.model.attributes));

			this.buildCurrent();
			this.buildHistory();

			this.$('.chart-container').bind('plothover', this.plotHoverEvent.bind(this));

			this.model.on('change', this.addHistory, this);
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

				if(this.history[item.field].length > config.historyLimit) {
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
			if(size < config.graphLimit + 1) {
				var left = config.graphLimit - size;
				var startTime = (history[0]) ? history[0].time : new Date().getTime();

				for(var i = 0; i < left; i++) {
					var time = startTime - (1000 * (left - i) * 5);
					historyArray.push([time, 0]);
				}

				var y = 0;
				for(var i = left; i < config.graphLimit; i++) {
					historyArray.push([history[y].time, history[y].plot]);
					y += 1;
				}
			} else {
				for(var i = size - config.graphLimit; i < size; i++) {
					historyArray.push([history[i].time, history[i].plot]);
				}	
			}
			return {data: historyArray, field: item.field, label: item.label, color: this.colors[item.field].border,
				lines: {
					fill: true
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

		updateGraph: function() {

		}
	});


	function ModalMulti(options) {
		this.id					= modalId++;

		this.activeModel		= {};
		this.graphHistory		= {};
		this.graphItems			= [];
		this.modalOpened		= false;
		this.previousTooltip	= null;

		this.panels				= {};

		this.options 			= _.defaults(options, defaultOptions);
		this.$el 				= $(this.options.el);
		this.$ 					= function(query) { return this.$el.find(query); };

		this.setupCollection();
	}

	ModalMulti.prototype.addTab = function(model) {
		var panel = new PanelView({
			model: model,
			modalId: this.id,
			graphItems: this.options.graphFields,
			regularGraph: this.options.regularGraph,
			tooltipLabel: this.options.tooltipLabel,
			colors: this.options.colors,
			yAxisFormatter: this.options.yAxisFormatter,
			tmplTabBody: this.options.tmplTabBody
		});

		this.panels[model.id] = panel;

		this.$('ul.nav-tabs').append(panel.renderLink());
		this.$('.tab-content').append(panel.render());

		this.options.initializeBody.call(panel, model);
	};

	ModalMulti.prototype.buildTabs = function() {
		if(this.collection.size() == 1) {
			this.$('ul.nav-tabs').hide();
		}
		
		this.collection.each(function(model) {
			this.addTab(model);
		}.bind(this));

		this.options.initialize.call(this, this.collection);
	};

	ModalMulti.prototype.fetch = function() {
		var base = this;
		this.collection.fetch({success: function() {
			if(!App.Config.StopUpdating) {
				base.fetch();
			}
		}});
	};

	ModalMulti.prototype.setupCollection = function() {

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
	
				if(!App.Config.StopUpdating) {
					this.fetch();
				}
			}.bind(this)});
		} else {
			this.options.collectionModel.on('change:collection', function(model) {
				this.collection.set(model.get('collection'));
			}, this);

			this.options.collectionModel.once('change:collection', function(model) {
				this.buildTabs();
			}, this);
		}
	};

	ModalMulti.prototype.setupModalEvents = function() {

		this.$el.on('shown.bs.modal', function () {
			this.modalOpened = true;
			this.panels['1'].buildGraph();
		}.bind(this)).on('hide.bs.modal', function () {
			this.modalOpened = false;
		}.bind(this));
	};
	
	ModalMulti.prototype.open = function() {
		this.$el.modal();
	};

	ModalMulti.prototype.updateGraph = function() {
		if(this.modalOpened) {
			var data = this.getDataPoints()
			  , graph = this.getActiveGraph();

			graph.setData(data);
			graph.setupGrid();
			graph.draw();
		}
	};


	function Modal(el, graphItems, options) {
		this.options = _.defaults(options, defaultOptions);
		this.$el = $(el);

		this.$ = function(query) {
			return this.$el.find(query);
		};

		this.setGraphItems(graphItems);
		this.setModalEvents();
		this.setPlotEvents();

		this.options.initialize.call(this);
	}


	Modal.prototype.graphHistory = {};
	Modal.prototype.graphItems = [];
	Modal.prototype.modalOpened = false;
	Modal.prototype.previousTooltip = null;
	
	Modal.prototype.open = function() {
		this.$el.modal();
	};

	Modal.prototype.update = function(model) {
		this.options.update.call(this, model);
	};

	Modal.prototype.updateHistory = function() {
		var runningSum = 0, time = new Date().getTime();

		var regularGraph = this.options.regularGraph;
		for(var i = 0; i < arguments.length; i++) {
			var data = arguments[i]
			  , historyItem = this.graphItems[i];

			runningSum += parseFloat(data);

			this.graphHistory[historyItem].push({
				plot: (regularGraph) ? data : runningSum,
				data: data,
				time: time
			});

			if(this.graphHistory[historyItem].length > config.historyLimit) {
				this.graphHistory[historyItem].shift();
			}
		}

		this.updateGraph();
	};

	Modal.prototype.updateGraph = function() {
		if(this.modalOpened) {
			var data = this.getDataPoints();
			this.dataGraph.setData(data);
			this.dataGraph.setupGrid();
			this.dataGraph.draw();
		}
	};

	Modal.prototype.showTooltip = function(x, y, colors, contents) {
		$('<div/>').addClass('chartTooltip').html(contents).css({
			top: y + 5,
			left: x + 5,
			'border-color':  colors.border,
			'background-color': colors.bg,
			opacity: 0.9
		}).appendTo('body').fadeIn(200);
	};

	Modal.prototype.getDataPoints = function() {
		var base = this, dataArray = [];
		for(var i = 0; i < this.graphItems.length; i++) {
			dataArray.push(this.getHistoryArray(this.graphItems[i]));
		}
		return dataArray;
	};

	Modal.prototype.getHistoryArray = function(item) {
		var historyArray = [];
		var history = this.graphHistory[item];


		var size = history.length;
		if(size <= config.graphLimit) { //>
			var left = config.graphLimit - size;
			var startTime = (history[0]) ? history[0].time : new Date().getTime();

			for(var i = 0; i < left; i++) {
				var time = startTime - (1000 * (left - i) * 5);
				historyArray.push([time, 0]);
			}

			var y = 0;
			for(var i = left; i < config.graphLimit; i++) {
				historyArray.push([history[y].time, history[y].plot]);
				y += 1;
			}
		} else {
			for(var i = size - config.graphLimit; i < size; i++) {
				historyArray.push([history[i].time, history[i].plot]);
			}	
		}
		return {
			data: historyArray,
			label: item,
			color: this.options.colors[item].border
		};
	};

	Modal.prototype.setUpGraph = function() {
		if(this.dataGraph == null) {
			this.dataGraph = this.$('.chart-container').plot(this.getDataPoints(), {
				yaxis: { min: 0, tickFormatter: this.options.yAxisFormatter },
				grid: { hoverable: true },
				xaxis: { mode: 'time', timezone: 'browser' },
				legend: {
					container : this.$('.chartLegend'),
					noColumns : this.graphItems.length
				}
			}).data('plot');
		} else {
			this.updateGraph();
		}
	},

	Modal.prototype.setModalEvents = function() {
		var base = this;
		this.$el.on('shown.bs.modal', function () {
			base.modalOpened = true;
			base.setUpGraph();
		}).on('hide.bs.modal', function () {
			base.modalOpened = false;
		});
	};

	Modal.prototype.setGraphItems = function(graphItems) {
		this.graphHistory = {};
		for(var i = 0; i < graphItems.length; i++) {
			this.graphHistory[graphItems[i]] = [];
		}
		this.graphItems = graphItems;
	};

	Modal.prototype.setPlotEvents = function() {
		var base = this;
		this.$('.chart-container').bind('plothover', function(event, pos, item) {
			if(item) {
				if(base.previousTooltip != item) {
					base.previousTooltip = item;
					$('.chartTooltip').remove();

					var type = base.graphHistory[item.series.label];

					var pos = -1;
					for(var i = 0; i < type.length; i++) {
						if(type[i].time == item.datapoint[0]) {
							pos = i;
						}
					}

					var data = (pos == -1) ? 'No data' : base.options.tooltipLabel(type[pos]);

					if(pos != -1) {
						function addZero(num) {
							return (num < 10) ? '0' + num : num;
						}
						var d = new Date(type[pos].time);
						var timeStr = d.getHours() + ':' + addZero(d.getMinutes()) + ':' + addZero(d.getSeconds());
						data = data.replace('%time%', timeStr);
					}

					var contents = '<strong>' + item.series.label + '</strong>: ' + data;
					base.showTooltip(item.pageX, item.pageY, base.options.colors[item.series.label], contents);
				}
			} else {
				$('.chartTooltip').remove();
				base.previousTooltip = null;            
			}
		});
	};

	App.Modal.Graph = Modal;
	App.Modal.GraphMulti = ModalMulti;
})(App, jQuery, _, Backbone);
