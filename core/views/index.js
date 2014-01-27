(function(App, $) {
  $(function() {
	function view(app) {
		var view = 'View';
		return app[view];
	}

	function panel(view) {
		var panel = 'Panel';
		return view[panel];
	}

    $('[rel=tooltip]').tooltip();
    $('span.service').tooltip();

	App.Bandwidth = {};

    App.Disks = new App.Collection.Disks();
    App.Disks.fetch();
    App.Disks.interval = setInterval(function() {
      if(!App.Config.StopUpdating) {
        App.Disks.fetch();
      }
    }, App.Config.UpdateDelayLong);

	var AppView = view(App)
	  , PanelView = panel(view(App));

    new AppView.TopBar();
    new AppView.BottomBar();
    new PanelView.Services();
    new PanelView.DiskSpace();
    new PanelView.DataCap();

    new PanelView.RecentlyAiredShows();
    new PanelView.RecentlyAddedMovies();
    new PanelView.CurrentlyWatching();

    if(App.Config.Enabled.SickBeard) {
      new PanelView.UpComingShows();
      new PanelView.Stat.TVCompletion();
    }

  });
})(App, jQuery);
