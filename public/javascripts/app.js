define([
	'backbone',

	'app/model/serverstats',
	'app/model/drives',

	'app/collection/drives',

	'app/view/topbar',
	'app/view/bottombar',

	'app/view/panel/currentlywatching',
	'app/view/panel/datacap',
	'app/view/panel/drivespace',
	'app/view/panel/recentlyaddedmovies',
	'app/view/panel/recentlyairedshows',
	'app/view/panel/services',
	'app/view/panel/tvcompletion',
	'app/view/panel/upcomingshows',

	(Config.Enabled.SABnzbd) ? 'app/view/panel/sabnzbd': '',

	'app/func/intervaltimeout',

], function(
		Backbone,

		ServerStatsModel,
		ModelDrives,

		CollectionDrives,

		TopBar,
		BottomBar,

		PanelCurrentlyWatching,
		PanelDataCap,
		PanelDrives,
		PanelRecentlyMovies,
		PanelRecentlyShows,
		PanelServices,
		PanelTVCompletion,
		PanelUpcomingShows,

		PanelSabnzbd,

		Timeout
) {
	function initialize() {
		if(!(this instanceof initialize)) {
			return new initialize();
		}

		this.Models = {};
		this.Collections = {
			Bandwidth: new (Backbone.Collection.extend({}))
		};

		this.getServerStats();
		this.getDrives();

		this._buildBars();
		this._buildPanels();
	};

	initialize.prototype._buildBars = function() {
		this.TopBar = new TopBar();
		this.BottomBar = new BottomBar(this);
	};

	initialize.prototype._buildPanels = function() {
		this.Panels = {
			CurrentlyWatching: new PanelCurrentlyWatching(this),
			DataCap: new PanelDataCap(this),
			Drives: new PanelDrives(this.Collections.Drives),
			RecentlyAddedMovies: new PanelRecentlyMovies(this),
			RecentlyAiredShows: new PanelRecentlyShows(this),
			Services: new PanelServices(this),
			TVCompletion: new PanelTVCompletion(this),
			UpcomingShows: new PanelUpcomingShows(this)

		};

		if(Config.Enabled.SABnzbd) {
			this.Panels.Sabnzbd = new PanelSabnzbd(this);
		}
	};

	initialize.prototype.getServerStats = function() {
		this.Models.ServerStats = new ServerStatsModel();

		var fetch = function() {
			this.Models.ServerStats.fetch();
		};

		Timeout(fetch.bind(this)).start();
	};

	initialize.prototype.getDrives = function() {
		this.Models.Drives = new ModelDrives();
		this.Collections.Drives = new CollectionDrives();

		Timeout(function() {
			this.Models.Drives.fetch();
		}.bind(this)).start();

		this.Models.Drives.on('change:collection', function(m) {
			this.Collections.Drives.set(m.get('collection'));
		}.bind(this));
	}


	return {
		initialize: initialize
	};
});
