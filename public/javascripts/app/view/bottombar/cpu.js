define([
	'jquery', 'backbone', 'numeral',
	'tmpl!view/bottombar-item',
	'app/func/modal/graph',
	'bootstrap'
], function($, Backbone, numeral, TmplBottomBar, ModalGraph) {

	var View = Backbone.View.extend({
		template: TmplBottomBar,

		loading: true,

		initialize: function(obj, App) {
			this.App = App;

			this.listenTo(this.model, 'change', this.update);

			this.App.Socket.on('cpu', function(data) {
				this.model.set(data);
			}.bind(this));

			this.$el.addClass('pointer').html(this.template(this.model.attributes));

			this.setupBar();
			this.setupModal();

			this.$el.click(function() {
				if(!this.loading) {
					this.modal.open();
				}
			}.bind(this));
		},

		setupBar: function() {
			this.divDetail = this.$('.detail');
			this.barProgressWait = $('<div/>', {title: 'IO Wait', rel: 'tooltip', class: 'progress-bar progress-bar-warning'});
			this.barProgressSys = $('<div/>', {title: 'System', rel: 'tooltip', class: 'progress-bar'});
			this.barProgressUser = $('<div/>', {title: 'User', rel: 'tooltip', class: 'progress-bar progress-bar-info'});

			var div = $('<div/>', {class: 'progress'}).append(this.barProgressWait).append(this.barProgressSys).append(this.barProgressUser);
			this.$('.progressDiv').append(div);
			
			this.$('[rel=tooltip]').tooltip();
		},

		setupModal: function() {
			this.modal = new ModalGraph($('#cpuModal'), ['IO Wait', 'System', 'User'], {
				colors: Config.Colors.CPU,
				initialize: function() {
					this.$('.progress-bar').tooltip();
				},
				yAxisFormatter: function(val, axis) {
					return val + '%';
				},
				update: function(model) {

					var cpuModel = model.get('cpu')
					  , loadAvgs = model.get('loadAvg')
					  , totalCPU = model.get('totalCPUs')
					  , cssNames = ['1min', '5min', '15min'];

					this.$('.cpuModel').html(cpuModel);

					for(var i = 0; i < cssNames.length; i++) {
						var load = Math.round(loadAvgs[i] * 100)
						  , percent = Math.round(loadAvgs[i] / totalCPU * 100);

						var percentColor = 'progress-bar-info';
						if(percent >= 75 && 90 > percent) {
							percentColor = 'progress-bar-warning';
						} else if(percent >= 90) {
							percentColor = 'progress-bar-danger';
						}

						var progressBar = this.$('dd.' + cssNames[i] + ' .progress-bar');
						progressBar.removeClass('progress-bar-info progress-bar-warning progress-bar-danger').addClass(percentColor);
						progressBar.css({width: percent + '%'});
						progressBar.attr('data-original-title', 'Load: ' + load + '%');
						this.$('dt.' + cssNames[i] + ' span').html(load + '%');
					}
				},
				tooltipLabel: function(data) {
					return data.data + '%<br /><small>at %time%</small>';
				}
			});
		},

		update: function(model) {
			if(this.loading) {
				this.$('.itemTooltip').attr('title', 'Click for more information').tooltip();
				this.loading = false;
			}

			var total = this.model.get('totalCPUs')
			  , sys = this.model.get('sys')
			  , user = this.model.get('user')
			  , wait = this.model.get('nice');	

			var totalPercent = Math.ceil((user + sys + wait));
			this.barProgressUser.css({width: Math.floor(user / total) + '%'}).attr('data-original-title', 'User: ' + user + '%');
			this.barProgressSys.css({width: Math.round(sys / total) + '%'}).attr('data-original-title', 'System: ' + sys + '%');
			this.barProgressWait.css({width: Math.floor(wait / total) + '%'}).attr('data-original-title', 'IO Wait: ' + wait + '%');
			this.divDetail.html(Math.round(totalPercent) + '%');


			this.modal.update(model);
			this.modal.updateHistory(wait, sys, user);
		},

		render: function() {
			return this.$el;
		}
	});

	return View;
});