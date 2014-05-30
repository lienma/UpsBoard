define({
	url: '',
	modelDefaults: {},
	regularGraph: false,
	useSocket: false,
	colors: {},
	tmplTabBody: null,
	graphFields: [],
	initialize: function() {},
	update: function() {},
	tooltipLabel: function(item) {
		return item.data;
	},
	yAxisFormatter: function(val, axis) {
		return val;
	}
});