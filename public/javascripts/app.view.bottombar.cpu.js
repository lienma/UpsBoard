!(function(App, $, _, Backbone) {

	var View = Backbone.View.extend({
		template: _.template($('#tmpl-bottom-display-item').html()),

		loading: true,
		modal: null,
		
		initialize: function() {
			var base = this;

			this.listenTo(this.model, 'change', this.update);
			this.$el.addClass('pointer').html(this.template(this.model.attributes));
			this.modal = this.buildModal();

			this.$el.click(function() {
				if(!base.loading) {
					base.modal.open();
				}
			});

			this.detailDiv = this.$('.detail');
			this.progressBarWait = $('<div/>', {title: 'IO Wait', rel: 'tooltip', class: 'progress-bar progress-bar-warning'});
			this.progressBarSys = $('<div/>', {title: 'System', rel: 'tooltip', class: 'progress-bar'});
			this.progressBarUser = $('<div/>', {title: 'User', rel: 'tooltip', class: 'progress-bar progress-bar-info'});

			var progressDiv = $('<div/>', {class: 'progress'}).append(this.progressBarWait).append(this.progressBarSys).append(this.progressBarUser);
			this.$('.progressDiv').append(progressDiv);
			
			this.$('[rel=tooltip]').tooltip();
		},

		buildModal: function() {
			return new App.Modal.Graph($('#cpuModal'), ['IO Wait', 'System', 'User'], {
				colors: App.Config.CPU,
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
			this.progressBarUser.css({width: Math.floor(user / total) + '%'}).attr('data-original-title', 'User: ' + user + '%');
			this.progressBarSys.css({width: Math.round(sys / total) + '%'}).attr('data-original-title', 'System: ' + sys + '%');
			this.progressBarWait.css({width: Math.floor(wait / total) + '%'}).attr('data-original-title', 'IO Wait: ' + wait + '%');
			this.detailDiv.html(Math.round(totalPercent) + '%');


			this.modal.update(model);
			this.modal.updateHistory(wait, sys, user);
		},

		render: function() {
			return this.$el;
		}
	});

	App.View.BottomBar.Cpu = View;
})(App, jQuery, _, Backbone);
