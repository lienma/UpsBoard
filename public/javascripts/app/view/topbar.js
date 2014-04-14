define([
	'jquery', 'underscore', 'backbone',

	'app/view/topbar/clock',
	(Config.WeatherEnabled) ? 'app/view/topbar/weather': '',
	'app/view/topbar/user'

], function($, _, Backbone, Clock, Weather, User) {

	var View =  Backbone.View.extend({
		el: '.top-display-bar',

		initialize: function() {

			this.clock = new Clock({el: this.$('.clock-container')});

			if(Config.WeatherEnabled) {
				this.weather = new Weather({el: this.$('.weather-container')});
			}

			this.user = new User({el: this.$('.user')});
		}
	});

	return View;
});