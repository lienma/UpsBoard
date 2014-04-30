
require.config({
	baseUrl: Config.WebRoot + '/javascripts',
	urlArgs: Config.Seed,

	paths: {
		'jquery': 'libs/jquery/jquery-2.0.3',
		'underscore': 'libs/underscore/underscore-1.5.2',
		'backbone': 'libs/backbone/backbone-1.1.0',
		'bootstrap': 'libs/bootstrap/bootstrap-3.1.1',
		'moment': 'libs/moment-with-langs.min',
		'numeral': 'libs/numeral.min',

		'text': 'libs/require/text',
		'tmpl': 'libs/require/tmpl',

		'skycons': 'libs/skycons',
		'jquery.flot': 'libs/jquery.flot/jquery.flot',
		'jquery.flot.time': 'libs/jquery.flot/jquery.flot.time',
		'jquery.livestamp':'libs/jquery.livestamp',
		'jquery.tablednd': 'libs/jquery.tablednd'
	},

	shim: {

		'backbone': {
			deps: ['underscore', 'jquery'],
			exports: 'Backbone'
		},

		'bootstrap':{
			deps: ['jquery']
		},

		'underscore': {
			exports: '_'
		},

		'skycons': {
			exports: 'Skycons'
		},

		'jquery.flot': {
			deps: ['jquery'],
			exports: '$.plot'
        },

		'jquery.flot.time': {
			deps: ['jquery.flot']
        },

		'jquery.livestamp': {
			deps: ['jquery'],
			exports: '$.plot'
        },

		'jquery.tablednd': {
			deps: ['jquery']
		}
	},

	tpl: {
		extension: '.tmpl',
		path: Config.WebRoot + '/templates/'
	}
});

require(['app'], function(App) {
	App.initialize();
});
