!(function(App, $, _, Backbone) {
	var CurrentlyWatchingModel = Backbone.Model.extend({
		idAttribute: '_id'
	});

	var CurrentlyWatchingCollection = Backbone.Collection.extend({
		model: CurrentlyWatchingModel,
		url: App.Config.WebRoot + '/api/plex/currentlyWatching'
	});

	var CurrentlyWatchingView = Backbone.View.extend({
		el: 'div.panel.currentlyWatching',

		initialize: function() {
			this.collection = new CurrentlyWatchingCollection();
			this.collection.on('add', this.addVideo, this);
			this.collection.on('remove', this.removeVideo, this);

			var base = this;
			this.collection.fetch();
			App.Funcs.IntervalTimeout(function() {
				base.collection.fetch();
			}, App.Config.UpdateDelay);

			this.slideCounter = 0;
		},

		addVideo: function(video) {
			this.slideCounter += 1;

			var type = video.get('type');
			var thumb = type == 'episode' ? 'tvShowThumb' : 'thumb'
			  , title = type == 'episode' ? 'tvShowTitle' : 'title';

			this.img = $('<img />', {src: App.Config.WebRoot + '/api/plex/poster?location=' + encodeURIComponent(video.get(thumb)) + '&width=300&height=500'})
			  , caption = $('<div />', {class: 'carousel-caption'}).html('<h3>' + video.get(title) + '</h3>');

			video.itemEl = $('<div />', {class: 'item' + ((this.slideCounter == 1) ? ' active' : '')}).append(this.img).append(caption);
			this.$('.carousel-inner').append(video.itemEl);

			this.resizeImg();
			$(window).on('resize', this.resizeImg.bind(this));

			if(this.slideCounter == this.collection.size()) {
				this.startSlideshow();
			}
		},

		resizeImg: function() {
			this.img.css({width: this.$('.carousel-inner').width() + 'px'});
		},

		removeVideo: function(video) {
			video.itemEl.remove();
			this.slideCounter -= 1;

			if(this.slideCounter == 0) {
				this.$('.currentlyWactchingNothing').show();
			}

			$(window).off('resize', this.resizeImg);
		},

		startSlideshow: function() {
			this.$('.currentlyWactchingNothing').hide();
			this.$('.carousel').carousel();
		}
	});


	App.View.Panel.CurrentlyWatching = CurrentlyWatchingView;
})(App, jQuery, _, Backbone);
