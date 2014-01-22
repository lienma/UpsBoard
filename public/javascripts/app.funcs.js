!(function(App, $, _, Backbone) {
	App.Funcs = {
		IntervalTimeout: function(func, time) {
			var time = (time) ? time : App.Config.UpdateDelay;
			var interval = setInterval(function() {
				if(!App.Config.StopUpdating) {
					func();
				}
			}, time);
			return interval;
		}
	};
})(App, jQuery, _, Backbone);
