define([
	'jquery', 'backbone', 'moment', 'skycons',
	'app/model/weather', 'tmpl!popover/weather', 'app/func/intervaltimeout',
	'bootstrap'
], function($, Backbone, moment, Skycons, WeatherModel, TmplWeatherPopover, Timeout) {

	var View = Backbone.View.extend({
		initialize: function() {

			this.popoverOpened = false

			this.text = this.$('.tempature');
			this.textColor = this.text.css('color');
			this.textTitle = this.text.data('tooltip-title');
			this.textTooltip = { placement: 'left', title: this.textTitle};

			this.text.tooltip(this.textTooltip);

			this.text.popover({
				placement: 'bottom', html: true,
				content: TmplWeatherPopover()
			});

			$(document).click(function(event) {
				if(this.popoverOpened) {
					var parents = $(event.target).parents();
					if(parents.index(this.$el) == -1) {
						this.text.popover('hide');
					}
				}
			}.bind(this));

			this.model = new WeatherModel();
			this.listenTo(this.model, 'change', function() {
				if(this.popoverOpened) {
					this.updatePopover();
				}
			}.bind(this));

			this.listenTo(this.model, 'change:currentTemp', this.updateTempature);
			this.listenTo(this.model, 'change:alerts', this.updateAlerts);

			this.text.on('shown.bs.popover', this.shownPopover.bind(this));
			this.text.on('hide.bs.popover', this.hidePopover.bind(this));

			this.timeout = new Timeout(this.fetch.bind(this), 300000);
			

			this.skycons = new Skycons({'color': '#333333'});

			return this.timeout.start();
		},

		fetch: function() {
			return this.model.fetch();
		},

		updateAlerts: function() {
			var divAlerts = $('.weather-alerts')
			  , alerts = this.model.get('alerts');
			
			if(alerts.length == 0) {
				divAlerts.addClass('hide');
			} else {
				var time = moment(alerts[0].expires * 1000).format('llll');
				var label = divAlerts.removeClass('hide').find('.label');
				label.html(alerts[0].title).tooltip({placement: 'bottom', title: 'In effect till ' + time});
			}
		},

		updateTempature: function() {
			var type = this.model.get('useFahrenheit') ? 'F' : 'C';
			var span = '<span class="ampm">' + type + '</span>';
			this.text.html(this.model.get('currentTemp') + '&deg;' + span);
		},

		shownPopover: function() {
			this.popoverOpened = true;
			this.updatePopover(true);
			this.text.css({color: $('body').css('color')});
			this.text.tooltip('destroy');

			var textWidth = this.text.width(), arrowMargin = textWidth / 2 + 6;

			this.$('.popover .arrow').css({width: (textWidth + 20) + 'px', marginLeft: '-' + arrowMargin + 'px'});
		},

		hidePopover: function() {
			this.popoverOpened = false;
			this.skycons.remove('weatherIcon');
			this.text.css({color: this.textColor});
			this.text.tooltip(this.textTooltip);
		},

		updatePopover: function(opening) {
			var model = this.model
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

	return View;
});
