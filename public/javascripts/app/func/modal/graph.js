define([
	'jquery', 'underscore',
	'app/func/modal/config',
	'app/func/modal/defaults',
	'bootstrap', 'jquery.flot', 'jquery.flot.time'
], function($, _, mConfig, mDefaults) {
	function Modal(el, graphItems, options) {
		this.options = _.defaults(options, mDefaults);
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

			if(this.graphHistory[historyItem].length > mConfig.historyLimit) {
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
		if(size <= mConfig.graphLimit) { //>
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
	return Modal;
});