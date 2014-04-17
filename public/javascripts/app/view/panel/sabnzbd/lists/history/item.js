define([
	'underscore', 'backbone', 'moment',
	'tmpl!view/sabnzbd/lists/history-item',
	'app/view/panel/sabnzbd/modal/deletenzb',

	'app/func/tooltip',
	'jquery.livestamp'
], function(_, Backbone, moment, TmplView, ModalDeleteNzb, Tooltip) {

	var View = Backbone.View.extend({
		tagName: 'tr',

		events: {
			'click .btn-delete-nzb': 'openDeleteModal'
		},

		initialize: function(obj, queueModel) {
			this.modalDeleteNzb = new ModalDeleteNzb();

			this.listenTo(this.modalDeleteNzb, 'delete', this.deleteNzbAction);

			this.buildView();
		},

		buildView: function() {
			var templateObj = {
				category: this.model.get('category'),
				id: this.model.id,
				nzb_name: this.model.get('nzb_name'),
				script_log_html: this.formatScriptLog(),
				size: this.model.get('size')
			};

			this.$el.html(TmplView(templateObj));

			this.tooltips = {
				deleteNzb: new Tooltip({el: this.$('.btn-delete-nzb')})
			}
			this.updateActionLine();
			this.listenTo(this.model, 'change:action_line', this.updateActionLine);
			this.listenTo(this.model, 'change:fail_message', this.updateActionLine);
			this.listenTo(this.model, 'change:script_line', this.updateActionLine);

			this.listenTo(this.model, 'change:script_log', function(model) {
				this.$('.script-log-modal-body').html(this.formatScriptLog());
			}.bind(this));

			this.updateStatus();
			this.listenTo(this.model, 'change:status', this.updateStatus);

			this.updateStages();

			var info = this.$('.item-info-btn');
			info.tooltip({title: 'Size: ' + this.model.get('size') + '<br />Category: ' + this.model.get('category'), html: true});

			var completed = this.model.get('completed');
			this.$('.time').attr('title', moment(completed).format('M/D h:mm a'));
			$(this.$('.time')).tooltip({placement:'left'});
			$(this.$('.time')).livestamp(completed);

			var menu = $(this.$('.menu'));

			this.menuOpened = false;
			this.$el.hover(function(event) {
				if(!this.isDeleting) {
					menu.slideDown('fast');
					this.menuOpened = true;
				}
			}.bind(this), function(event) {
				if(!this.isDeleting || this.menuOpened) {
					menu.slideUp('fast');
				}
			}.bind(this));
		},

		formatScriptLog: function() {
			var log = this.model.get('script_log');

			log = log.replace(/</g, '&lt;');
			log = log.replace(/>/g, '&gt;');
			log = log.replace(/\n/g, '<br />');

			return log;
		},

		render: function() {
			return this.$el;
		},

		updateActionLine: function() {
			var text = this.model.get('action_line')
			  , div = this.$('.action-line');

			if(this.model.get('status') == 'Failed') {
				div.addClass('failed');
				text = this.model.get('fail_message');
			} else {
				div.removeClass('failed');

				if(this.model.get('status') == 'Completed') {
					//text = this.model.get('script_line');
				}
			}

			div.text(text);
		},

		createStageBtn: function(className, title) {
			var btn = $('<button type="button" class="btn btn-default btn-xs btn-stage">');
			var icon = $('<i/>').addClass(className);

			btn.tooltip({title: title, html: true});
			return btn.append(icon);
		},

		updateStages: function() {
			var stages = this.model.get('stage_log');
console.log(stages);
			(_.isArray(stages) ? stages : []).forEach(function(stage) {
				var className = '', title = false, enabled = true;;
				switch(stage.name) {
					case 'Download':
						className = 'glyphicon glyphicon-time';
						break;

					case 'Source':
						enabled = false;
						className = 'glyphicon glyphicon-globe';
						break;

					case 'Unpack':
						className = 'fa fa-puzzle-piece';
						break;

					case 'Repair':
						className = 'fa fa-wrench';
						break;

					case 'Script':
						className = 'glyphicon glyphicon-bookmark';
						title = 'View Script Log';
						break;
				}

				if(enabled) {
					title = (title) ? title : stage.actions[0];
					var btn = this.createStageBtn(className, title)

					if(stage.name == 'Script') {
						btn.click(function() {
							$(this.$('.script-log-modal')).modal();
						}.bind(this));
					}

					this.$('.menu .stages').append(btn);
				}
			}.bind(this));
		},	

		updateStatus: function() {
			var icon = this.$('.status-icon'), status = this.model.get('status');

			icon.removeClass('fa fa-circle-o glyphicon glyphicon-ok-sign glyphicon-export glyphicon-cog rotate-icon-slow');
			this.$el.removeClass('warning success')

			var iconStatus = '';
			if(status == 'Completed') {
				iconStatus = 'fa fa-circle-o';

			} else if(status == 'Extracting') {
				iconStatus = 'glyphicon glyphicon-export';
				this.$el.addClass('success');

			} else if(status == 'Running') {
				iconStatus = 'glyphicon glyphicon-cog rotate-icon-slow';
				this.$el.addClass('success');

			} else if(status == 'Failed') {
				iconStatus = 'fa fa-exclamation-triangle failed';
				this.$el.addClass('warning');

			}

			icon.addClass(iconStatus);
		},

		isDeleting: false,

		openDeleteModal: function() {
			var icon = this.$('.icon-delete-nzb');

			if(!icon.hasClass('rotate-icon')) {
				this.modalDeleteNzb.open();
			}
		},

		deleteNzbAction: function(deleteFiles) {
			var icon = this.$('.icon-delete-nzb');

			if(!icon.hasClass('rotate-icon')) {
				icon.addClass('rotate-icon');
				this.isDeleting = true;
				this.tooltips.deleteNzb.update('Sending Request');

				var overlay = $('<div/>').addClass('overlay');

				this.$('td').css('position', 'relative');
				this.$('td').append(overlay);

				this.model.call('delete', deleteFiles).done(function(data) {
					this.$el.slideUp();
					this.isDeleting = false;
				}.bind(this));
			}
		}

		
	});

	return View;
});