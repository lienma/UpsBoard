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



	


	function ModalMulti(options) {
		var self = this;

		this.options = _.defaults(options, defaultOptions);
		this.$el = $(this.options.el);

		this.$ = function(query) {
			return this.$el.find(query);
		};

		this.body = function(id) {
			var paneId = '#paneId' + id;
			var body = self.$(paneId);

			return new (function() {
				this.editField = function(field, text) {
					body.find(field).html(text);
				};

				this.find = function(jquery) {
					return body.find(jquery);
				};
			})();
		};

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
				if(self.collection.size() == 1) {
					self.$('ul.nav-tabs').hide();
				}
	
				self.collection.each(function(model) {
					self.addTab(model);
				});
				self.options.initialize.call(this, self.collection);
	
				if(!App.Config.StopUpdating) {
					self.fetch();
				}
			}});
		} else {
			options.collectionModel.on('change:collection', function(model) {
				self.collection.set(model.get('collection'));
			}, this);

			options.collectionModel.once('change:collection', function(model) {
				self.buildTabs();
			});


		}
	}

	ModalMulti.prototype.activeModel = {};
	ModalMulti.prototype.graphHistory = {};
	ModalMulti.prototype.graphItems = [];
	ModalMulti.prototype.modalOpened = false;

	ModalMulti.prototype.addHistory = function(model) {
		var runningSum = 0, time = new Date().getTime()
		  , base = this;

		this.getGraphFields(function(field) {
			var data = model.get(field.field);
			runningSum += parseFloat(data);

			base.graphHistory[model.id][field.field].push({
				plot: (base.options.regularGraph) ? data : runningSum,
				data: data,
				time: time
			});

			if(base.graphHistory[model.id][field.field].length > config.historyLimit) {
				base.graphHistory[model.id][field.field].shift();
			}
		});
		base.updateGraph();
	};

	ModalMulti.prototype.addTab = function(model) {
		this.buildTab(model);
		this.buildCurrentLegend(model);
		this.buildGraphHistory(model);
		this.setupHistoryWatch(model);
		this.setupPlotEvents(model);

		if(model.get('default')) {
			this.activeModel = model;
		}

		this.options.initializeBody.call(this, model);
	};

	ModalMulti.prototype.buildCurrentLegend = function(model) {
		var graphFields = this.options.graphFields
		  , current = model.modalPanel.find('dd.current .online');

		for(var i = 0; i < graphFields.length; i++) {
			current.append($('<strong />').html(graphFields[i].label + ': '));
			current.append($('<span />').addClass(graphFields[i].field));
		}
	};

	ModalMulti.prototype.buildGraph = function() {
		var activePanel = this.getActivePanel();
		if(this.activeModel.modalGraph == null) {
			this.activeModel.modalGraph = activePanel.find('.chartContainer').plot(this.getDataPoints(), {
				yaxis: { min: 0, tickFormatter: this.options.yAxisFormatter },
				grid: { hoverable: true },
				xaxis: { mode: 'time', timezone: 'browser' },
				legend: {
					container : activePanel.find('.chartLegend'),
					noColumns : this.options.graphFields.length
				}
			}).data('plot');
		} else {
			this.updateGraph();
		}
	};

	ModalMulti.prototype.buildGraphHistory = function(model) {
		var base = this, id = model.id;
		this.graphHistory[id] = {};
		this.getGraphFields(function(field) {
			base.graphHistory[id][field.field] = [];
		});
		this.addHistory(model);
	};

	ModalMulti.prototype.buildTab = function(model) {
		var base = this
		  , tabs = this.$('ul.nav-tabs')
		  , bodies = this.$('.tab-content')
		  , template = _.template($('#tmpl-modal-graph-multi').html())
		  , tmplBody = _.template(this.options.tmplTabBody);

		var dfault = model.get('default'), label = model.get('label'), id = model.id;
		var paneId = 'paneId' + id;

		model.modalTab = $('<li />').addClass((dfault) ? 'active' : '');
		var link = $('<a/>', {'data-toggle':'tab', href:'#' + paneId}).html(label);
		link.on('shown.bs.tab', function(e) {
			base.activeModel = model;
			base.buildGraph();
		});
		model.modalTab.append(link);
		tabs.append(model.modalTab);

		model.modalPanel = $('<div />', {id: paneId}).addClass('tab-pane fade').addClass((dfault) ? 'in active' : '');
		model.modalPanel.html(template()).find('.graphModalBody').append(tmplBody(model.attributes));
		bodies.append(model.modalPanel);

		model.modalPanel.find('button.close').click(function() {
			model.modalPanel.find('.alertBackground').hide();
		});
	};

	ModalMulti.prototype.buildTabs = function() {
		var self = this;

		if(this.collection.size() == 1) {
			this.$('ul.nav-tabs').hide();
		}
		
		this.collection.each(function(model) {
			self.addTab(model);
		});
		this.options.initialize.call(this, this.collection);
	};

	ModalMulti.prototype.getActivePanel = function() {
		return this.activeModel.modalPanel;
	};

	ModalMulti.prototype.getActiveGraph = function() {
		return this.activeModel.modalGraph;
	};

	ModalMulti.prototype.getGraphFields = function(forEach) {
		if(typeof forEach == 'function') {
			this.options.graphFields.forEach(function(field) {
				forEach(field);
			});
			return;
		}
		return this.options.graphFeilds;
	};

	ModalMulti.prototype.fetch = function() {
		var base = this;
		this.collection.fetch({success: function() {
			if(!App.Config.StopUpdating) {
				base.fetch();
			}
		}});
	};

	ModalMulti.prototype.setupHistoryWatch = function(model) {
		var base = this, regularGraph = this.options.regularGraph;
		model.on('change', this.addHistory, this);
	};

	ModalMulti.prototype.setupModalEvents = function() {
		var base = this;
		this.$el.on('shown.bs.modal', function () {
			base.modalOpened = true;
			base.buildGraph();
		}).on('hide.bs.modal', function () {
			base.modalOpened = false;
		});
	};

	ModalMulti.prototype.setupPlotEvents = function(model) {
		var base = this;

		model.modalPanel.find('.chartContainer').bind('plothover', function(event, pos, item) {
			if(item) {
				if(base.previousTooltip != item) {
					base.previousTooltip = item;
					$('.chartTooltip').remove();

					var id = base.activeModel.id;
					var type = base.graphHistory[id][item.series.field];

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
					base.showTooltip(item.pageX, item.pageY, base.options.colors[item.series.field], contents);
				}
			} else {
				$('.chartTooltip').remove();
				base.previousTooltip = null;            
			}
		});
	};

	ModalMulti.prototype.previousTooltip = null;
	
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

	ModalMulti.prototype.showTooltip = function(x, y, colors, contents) {
		$('<div/>').addClass('chartTooltip').html(contents).css({
			top: y + 5,
			left: x + 5,
			'border-color':  colors.border,
			'background-color': colors.bg,
			opacity: 0.9
		}).appendTo('body').fadeIn(200);
	};

	ModalMulti.prototype.getDataPoints = function() {
		var base = this, dataArray = [];

		this.options.graphFields.forEach(function(field) {
			var history = base.getHistoryArray(field);
			dataArray.push(history);
		});
		return dataArray;
	};

	ModalMulti.prototype.getHistoryArray = function(field) {
		var historyArray = [];

		var history = this.graphHistory[this.activeModel.id][field.field];

		var size = history.length;
		if(size < config.graphLimit + 1) { //>
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
		return {data: historyArray, field: field.field, label: field.label, color: this.options.colors[field.field].border,
			lines: {
				fill: true
			}
		};
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
			var history = base.getHistoryArray(this.graphItems[i]);
			dataArray.push(history);
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
			this.dataGraph = this.$('.chartContainer').plot(this.getDataPoints(), {
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
		this.$('.chartContainer').bind('plothover', function(event, pos, item) {
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
