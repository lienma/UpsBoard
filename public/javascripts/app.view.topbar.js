!(function(App, $, _, Backbone, Skycons) {


	var TopBar =  Backbone.View.extend({
		el: '.top-display-bar',

		initialize: function() {
			this.clock = new Clock({el: this.$('.clock-container')});

			if(App.Config.weatherEnabled) {
				this.weather = new Weather({el: this.$('.weather-container')});
			}

			if(App.Config.IsLoggedIn) {
				this.user = new User({el: this.$('.user')});
			} else {
				this.login = new Login({el: this.$('.login')});
			}
		}
	});

	var Login = Backbone.View.extend({
		initialize: function() {
			var self = this;


			this.all = this.$('input[type="text"], input[type="password"], button').not(':focus');
			this.all.focus(function() {
console.log('focus');
				//if(self.all.not(':focus')) {
				//	self.all.addClass('focused').animate({opacity: 1});
				//}
			}).blur(function() {
				if(self.all.is(':focus')) {
					//self.all.animate({opacity: 0.8});
				}
			});
		}
	});

	var User = Backbone.View.extend({
		popoverOpened: false,

		initialize: function() {
			var self = this;

			this.$('img').popover({
				placement: 'bottom', html: true,
				content: $('#tmpl-user-popover').html()
			});

			$(document).click(function(event) {
				if(self.popoverOpened) {
					var parents = $(event.target).parents();
					if(parents.index(self.$el) == -1) {
						self.$('img').popover('hide');
					}
				}
			});

			this.$('img').on('shown.bs.popover', function() {
				self.popoverOpened = true;
			}).on('hide.bs.popover', function() {
				self.popoverOpened = false;
			});
		}
	});


	var Clock = Backbone.View.extend({

		initialize: function() {
			var self = this;

			this.clock = this.$('.clock');

			this.update();
			setInterval(function() { self.update(); }, 30000);
		},

		update: function() {
			var m = moment();
			this.clock.tooltip({
				placement: 'left',
				title: m.format('dddd, MMMM D, YYYY')
			});

			this.clock.find('.time').html(m.format('h:mm'));
			this.clock.find('.ampm').html(m.format('A'));
		}
	});

	var WeatherModel = Backbone.Model.extend({
		url: App.Config.WebRoot + '/stats/weather'
	});

	var Weather = Backbone.View.extend({
		popoverOpened: false,

		initialize: function() {
			var self = this;

			this.text = this.$('.tempature');
			this.textColor = this.text.css('color');
			this.textTitle = this.text.data('tooltip-title');
			this.textTooltip = { placement: 'left', title: this.textTitle};

			this.text.tooltip(this.textTooltip);

			this.text.popover({
				placement: 'bottom', html: true,
				content: $('#tmpl-weather-popover').html()
			});

			this.weather = new WeatherModel();
			this.weather.on('change', function(model) {
				if(self.popoverOpened) {
					self.updatePopover();
				}
			});

			$(document).click(function(event) {
				if(self.popoverOpened) {
					var parents = $(event.target).parents();
					if(parents.index(self.$el) == -1) {
						self.text.popover('hide');
					}
				}
			});

			this.weather.on('change:currentTemp', function(model) {
				var type = model.get('useFahrenheit') ? 'F' : 'C';
				var span = '<span class="ampm">' + type + '</span>';
				self.text.html(model.get('currentTemp') + '&deg;' + span);
			});

			this.weather.on('change:alerts', function(model) {
				var divAlerts = $('.weather-alerts')
				  , alerts = model.get('alerts');
				
				if(alerts.length == 0) {
					divAlerts.addClass('hide');
				} else {
					var time = moment(alerts[0].expires * 1000).format('llll');
					var label = divAlerts.removeClass('hide').find('.label');
					label.html(alerts[0].title).tooltip({placement: 'bottom', title: 'In effect till ' + time});
				}
			});

			this.text.on('shown.bs.popover', function() {
				self.popoverOpened = true;
				self.updatePopover(true);
				self.text.css({color: $('body').css('color')});
				self.text.tooltip('destroy');

				var textWidth = self.text.width(), arrowMargin = textWidth / 2 + 6;

				self.$('.popover .arrow').css({width: (textWidth + 20) + 'px', marginLeft: '-' + arrowMargin + 'px'});
			});

			this.text.on('hide.bs.popover', function() {
				self.popoverOpened = false;
				self.skycons.remove('weatherIcon');
				self.text.animate({color: self.textColor});
				self.text.tooltip(self.textTooltip);
			});

			this.weather.fetch();
			setInterval(function() {
				if(!App.Config.StopUpdating) {
					self.weather.fetch();
				}
			}, 300000);

			this.skycons = new Skycons({'color': '#333333'});
		},

		updatePopover: function(opening) {
			var model = this.weather
			  , popover = this.$('.popover');

			this.skycons[(opening) ? 'add' : 'set']('weatherIcon', model.get('currentIcon'));
			this.skycons.play();

			popover.find('.tempature').html(model.get('currentTemp') + '&deg;');
			popover.find('.detail').html(model.get('currentSummary'));
			popover.find('.next-24').html(model.get('hourlySummary'));

			var nextHour = model.get('minutelySummary');
			if(nextHour) {
				popover.find('.next-hour-title');
				popover.find('.next-hour').show().html(nextHour);
			} else {
				popover.find('.next-hour-title').hide();
				popover.find('.next-hour').hide();
			}
		}
	});

	App.View.TopBar = TopBar;
})(App, jQuery, _, Backbone, Skycons);
