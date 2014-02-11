!(function(App, $, _, Backbone, numeral) {
	var API_URL = App.Config.WebRoot + '/api/sabnzbd/';

	var StatusQueueModel = Backbone.Model.extend({
		'url': API_URL + 'getQueue',

		start: function() {
			var defer = $.Deferred();

			this._fetch().done(defer.resolve).fail(defer.reject);

			return defer.promise();
		},

		_failedFetches: 0,
		_timeout: null,
		_startTimeout: function() {
			this._timeout = setTimeout(function() {
				this._timeout = null;

				this._fetch().done(function() {
					this._failedFetches = 0;
				}.bind(this)).fail(function() {
					this._failedFetches += 1;
				}.bind(this));
			}.bind(this), (this._failedFetches > 450) ? 30000 : 2000);
		},

		_fetch: function() {

			if(this._timeout != null) {
				clearTimeout(this._timeout);
				this._timeout = null;
			}

			this._startTimeout();

			return this.fetch();
		},

		forceUpdate: function() {
			return this._fetch();
		}
	});

	var SlotsModel = Backbone.Model.extend({
		idAttribute: 'nzo_id',

		call: function(method, value) {
			var url = API_URL + 'queue/' + this.id + '/' + method;
			if(value) {
				url += '/' + value;
			}
console.log(url);

			var defer = $.Deferred();
			$.getJSON(url).done(function(data) {
				this.forceUpdate();

				defer.resolve(data);
			}.bind(this)).fail(defer.reject);

			return defer.promise();
		},

		forceUpdate: function() {
			return this.collection.forceUpdate();
		}
	});

	var SlotsCollection = Backbone.Collection.extend({
		model: SlotsModel,
		forceUpdate: function() { }
	});

	var MainView = Backbone.View.extend({
		el: '.panel.sabnzbd',

		enabled: false,

		initialize: function() {
			var self = this;

			this.status = new StatusQueueModel();
			this.status.start()
				.then(this.buildView.bind(this))
				.fail(this.failed.bind(this));
		},

		failed: function() {
console.log('Failed');
		},

		buildView: function() {
			this.enabled = true;

			new TimeLeftView({model: this.status, el: this.$('.time-left .time')});
			new PauseButtonView({model: this.status, el: this.$('.puase-downloading')});
			new SpeedView({model: this.status, el: this.$('.downloading-speed')});
			new RemainingSpaceView({model: this.status, el: this.$('.remaining-space')});
			new ListsView({model: this.status, el: this.$el});
		},

		addJobToQueue: function(model) {
console.log(model.id);
		}
	});

	var SpeedView = Backbone.View.extend({

		initialize: function() {
			this.model.on('change:kbpersec', this.update, this);
			this.update(this.model);
		},

		update: function(model) {
			var kilobytes = Math.round(parseFloat(model.get('kbpersec')));

			var unit = 'KB/s';
			if(kilobytes >= 1024) {
				unit = 'MB/s';
			}

			kilobytes = (kilobytes >= 1024) ? Math.round(kilobytes / 1024 * 10) / 10 : kilobytes;

			this.$('.number').html(kilobytes);
			this.$('.unit').text(' ' + unit);
		}
	});

	var RemainingSpaceView = Backbone.View.extend({

		initialize: function() {
			this.model.on('change:mb', this.updateTotal, this);
			this.model.on('change:mbleft', this.updateLeft, this);

			this.updateTotal(this.model);
			this.updateLeft(this.model);
		},

		getSize: function(mb) {
			var bytes = Math.round(parseFloat(mb) * 1024 * 1024);
			return numeral(bytes).format('0.0 b');
		},

		updateLeft: function(model) {
			var left = this.getSize(this.model.get('mbleft'));
			this.$('.left').text(left);
		},

		updateTotal: function(model) {
			if(parseInt(this.model.get('mb')) == 0) {
				this.$el.hide();
			} else {
				this.$el.show();
				var total = this.getSize(this.model.get('mb'));
				this.$('.total').text(total);
			}
		}
	});

	var TimeLeftView = Backbone.View.extend({

		initialize: function() {

			this.model.on('change:timeleft', this.updateTimeLeft, this);
			this.model.on('change:paused', this.updatePause, this);

			this.updatePause(this.model);
		},

		updateTimeLeft: function(model) {
			if(!model.get('paused')) {
				this.$el.text(model.get('timeleft'));
			}
		},

		updatePause: function(model) {
			this.$el.text(model.get('paused') ? '--' : model.get('timeleft'));
		}
	});

	var PauseButtonView = Backbone.View.extend({

		messageResume: 'Resume downloading the queue.',
		messagePause: 'Pause the queue from downloading.',

		events: {
			'click': 'action'
		},

		initialize: function() {
			var self = this;

			this.model.on('change:paused', this.update, this);

			if(this.model.get('paused')) {
				this.$el.addClass('enabled');
			}

			var message = (this.model.get('paused')) ? this.messageResume : this.messagePause;
			this.$el.attr('title', message).tooltip({placement: 'bottom'});

			this.$el.on('show.bs.tooltip', function() {
				self.tooltip = true;
			}).on('hide.bs.tooltip', function() {
				self.tooltip = false;
			});
		},

		action: function() {
			var self = this;
			if(!this.$el.hasClass('rotate-icon')) {

				this.$el.addClass('rotate-icon');
				this.updateTooltip('Sending Request');

				var method = this.model.get('paused') ? 'resumeQueue' : 'pauseQueue';
				$.getJSON(API_URL + method).done(function(data) {
					self.model.forceUpdate().done(function() {
						self.$el.removeClass('rotate-icon');
					});
				});
			}
		},

		update: function(model) {
			var paused = model.get('paused');

			if(paused) {
				this.$el.addClass('enabled');
			} else {
				this.$el.removeClass('enabled');
			}

			var message = (paused) ? this.messageResume : this.messagePause;
			this.updateTooltip(message);
		},

		updateTooltip: function(message) {
			var wasOpened = this.tooltip;
			if(wasOpened) {
				this.$el.tooltip('hide');
			}

			this.$el.attr('data-original-title', message);

			if(wasOpened) {
				this.$el.tooltip('show');
			}	
		}
	});

	var ListsView = Backbone.View.extend({

		events: {
			'click .list-btn.btn-queue': 'switchToQueue',
			'click .list-btn.btn-history': 'switchToHistory'
		},

		initialize: function() {
			this.$btnQueue = this.$('.list-btn.btn-queue');
			this.$btnHistory = this.$('.list-btn.btn-history');

			this.viewQueue = new ListQueueView({el: this.$('.list-body.list-queue'), model: this.model, body: this.$el});
			this.viewHistory = new ListHistoryView({el: this.$('.list-body.list-history'), model: this.model});


			this.updateNumOfSlots(this.model);
			this.model.on('change:noofslots', this.updateNumOfSlots, this);

			this.$('.loading').fadeOut('fast');
		},

		switchToHistory: function(event) {
			if(this.viewQueue.isActive()) {
				this.$btnHistory.addClass('active');
				this.$btnQueue.removeClass('active');

				this.viewHistory.activate();
				this.viewQueue.deactivate();
			}
		},

		switchToQueue: function(event) {
			if(this.viewHistory.isActive()) {
				this.$btnQueue.addClass('active');
				this.$btnHistory.removeClass('active');

				this.viewQueue.activate();
				this.viewHistory.deactivate();
			}
		},

		updateNumOfSlots: function(model) {
			var num = parseInt(model.get('noofslots'));
			this.$('.nzbs-in-queue').text(numeral(num).format('0,0'));
		}
	});

	var ListQueueView = Backbone.View.extend({
		initialize: function(obj) {
			this._active = true;

			this.body = obj.body;

			this.slots = new SlotsCollection();
			this.slots.forceUpdate = this.model.forceUpdate.bind(this.model);

			this.setupSlotMonitor();

			this.$('table').tableDnD({
				dragHandle: this.$('.drag-handle'),

				onDragClass: 'dragging-row',
				onDrop: this.onDrop.bind(this)	
			});

			$(window).resize(this.resize);
		},

		onDrop: function(table, row) {
			var nzbId = $(row).data('nzb');
			var position = this.getIndexById(nzbId);

			if(position != this.slots.get(nzbId).get('index')) {
				$.getJSON(API_URL + 'queue/' + nzbId + '/move/' + position);
			}

			this.resetRowColors();
		},

		resetRowColors: function() {
			this.$('tr.item-row').removeClass('alt');
			this.$('tr.item-row:odd').addClass('alt');
		},

		setupSlotMonitor: function() {
			this.slots.on('add', this.addToQueue, this);
			this.slots.on('remove', this.removeFromQueue, this);

			this.slots.set(this.model.get('slots'));

			this.model.on('change:slots', function(model) {
				this.slots.set(model.get('slots'));
			}, this);
		},

		addToQueue: function(model) {
			model.view = new QueueItemView({model: model}, this.model);
			var view = model.view.$el;
			view.attr('data-nzb', model.id);
			view.attr('data-index', model.get('index'));

			var childern = this.$('.table tbody').children();

			var index 	= model.get('index')
			  , pos		= index - 1;

			if(pos == -1) {
				this.$('.table tbody').append(view);
			} else {
				$(childern[pos]).after(view);
			}

			this.$('table').tableDnDUpdate();
			this.resetRowColors();

			this.resize();

			model.on('change:index', this.changeItemPosition, this);
		},

		getIndexById: function(id) {
			var childern = this.$('.table tbody').children();

			var index = -1;

			childern.each(function(i, el) {
				if($(el).data('nzb') == id) {
					index = i;
				}
			});

			return index;
		},

		changeItemPosition: function(model) {
			var childern	= this.$('.table tbody').children()
			  , i			= this.getIndexById(model.id)
			  , index		= model.get('index')
			  , child		= $(childern[index])
			  , length 		= childern.length;

			if(!(i == index || child.data('nzb') == model.id)) {
				var view = model.view.$el.detach();

				if(index == 0 || (length > index + 1)) {
					child.before(view);
				} else {
					child.after(view);
				}
			}
		},

		removeFromQueue: function(model) {
console.log('delete', model);
			model.view.removeViews();
			model.view.remove();

console.log('len', this.slots.length);
		},

		resize: function() {
			var width = this.$('td.middle').width();
			width = Math.floor(width / 4) - 8;
			this.$('.select-event').css('width', width + 'px');
		},


		_active: true,
		isActive: function() {
			return this._active;
		},

		activate: function() {
			this._active = true;
			this.$el.slideDown();
			this.model.forceUpdate();
		},

		deactivate: function() {
			this._active = false;
			this.$el.slideUp();
		}
	});

	var QueueItemView = Backbone.View.extend({
		tagName: 'tr',

		template: _.template($('#tmpl-panel-sabnzbd-queue-item').html()),

		events: {
			'change .select-event': 'eventSelects',
			'click .btn-delete-nzb': 'clickDeleteNzb',
			'click .btn-modal-delete-nzb': 'clickDeleteNzbAction',
			'click .btn-modal-delete-nzb-files': 'clickDeleteNzbAction'
		},

		initialize: function(obj, queueModel) {
			this.queueModel = queueModel;
			this.$el.attr('id', this.model.get('index') + 1).addClass('item-row');

			this.buildView();
			this.setOnChange();

			this.queueModel.on('change:scripts', this.updateScriptSelect, this);
			this.queueModel.on('change:categories', this.updateCategoriesSelect, this);

			this.viewPause = new QueueItemPauseView({el: this.$('.queue-item-pause'), model: this.model});
			this.viewProgress = new QueueItemProgressView({el: this.$el, model: this.model});
		},

		buildView: function() {
			var templateObj = {
				cat: this.model.get('cat'),
				filename: this.model.get('filename'),

				id: this.model.id,
				priority: this.model.get('priority'),

				script: this.model.get('script'),
				status: this.model.get('status')
			};

			this.$el.html(this.template(templateObj));

			this.$('[rel=tooltip]').tooltip();

			this.updateCategoriesSelect();
			this.updateScriptSelect();

			this.updateCategory();
			this.updatePriority();
			this.updateProcessing();
			this.updateScript();

			var menu = $(this.$('.menu'));
			this.$el.hover(function(event) {
				menu.slideDown('fast');
			}, function(event) {
				menu.slideUp('fast');
			});

			this.deleteTooltip = false;
			this.$('.btn-delete-nzb').on('show.bs.tooltip', function() {
				this.deleteTooltip = true;
			}.bind(this)).on('hide.bs.tooltip', function() {
				this.deleteTooltip = false;
			}.bind(this));

			this.deleteModal = false
			this.$('.modal-delete-nzb').on('show.bs.modal', function() {
				this.deleteModal = true;
			}.bind(this)).on('hide.bs.modal', function() {
				this.deleteModal = false;
			}.bind(this));
		},

		clickDeleteNzb: function() {
			var icon = this.$('.icon-delete-nzb');
			if(!icon.hasClass('rotate-icon')) {
				this.$('.modal-delete-nzb').modal();
			}	
		},

		clickDeleteNzbAction: function(event) {
			var icon = this.$('.icon-delete-nzb');
			if(this.deleteModal) {
				this.$('.modal-delete-nzb').modal('hide');

				if(!icon.hasClass('rotate-icon')) {
					icon.addClass('rotate-icon');

					this.updateTooltip(this.$('.btn-delete-nzb'), 'delete', 'Sending Request');

					var deleteFiles = $(event.target).data('files');
					this.model.call('delete', deleteFiles).done(function(data) {
console.log(data);
					}.bind(this));
				}
			}
		},

		updateTooltip: function(el, name, message) {
			var wasOpened = this[name + 'Tooltip'];
			if(wasOpened) {
				el.tooltip('hide');
			}

			el.attr('data-original-title', message);

			if(wasOpened) {
				el.tooltip('show');
			}	
		},

		setOnChange: function() {

			var fields = ['filename', 'status', 'cat'];
			fields.forEach(function(field) {

				this.model.on('change:' + field, function(m) {
					var text = m.get(field);

					this.$('.' + field + '-text').text(text);
				}.bind(this));

			}.bind(this));

			this.model.on('change:cat', this.updateCategory, this);
			this.model.on('change:priority', this.updatePriority, this);
			this.model.on('change:script', this.updateScript, this);
			this.model.on('change:unpackopts', this.updateProcessing, this);

		},

		eventSelects: function(event) {
			var element	= $(event.target)
			  , type	= element.data('type')
			  , value	= element.val()
			  , field	= element.data('field');

			this.model.call(type, String(value).toLowerCase()).done(function(data) {
console.log('data', data);

				this.model.set(field, value);
				if(type == 'priority') {
					this.model.set('index', data.position);
				}
			}.bind(this));
		},

		updateCategoriesSelect: function() {
			var categories = this.queueModel.get('categories');
			var select = this.$('.category-select').empty();
			categories.forEach(function(category) {
				select.append(new Option(category, category));
			});
		},

		updateCategory: function() {
			this.$('.category-select').val(this.model.get('cat'));
		},

		updatePriority: function() {
			this.$('.priority-select').val(this.model.get('priority'));
		},

		updateProcessing: function() {
			this.$('.unpackopts-select').val(this.model.get('unpackopts'));
		},

		updateScript: function() {
			this.$('.scripts-select').val(this.model.get('script'))
		},

		updateScriptSelect: function() {
			var scripts = this.queueModel.get('scripts');
			var select = this.$('.scripts-select').empty();
			scripts.forEach(function(script) {
				select.append(new Option(script, script));
			});
		},

		removeViews: function() {
			this.viewPause.remove();
			this.viewProgress.remove();
		},

		render: function() {
			return this.$el;
		}
	});

	var QueueItemPauseView = Backbone.View.extend({
		events: {
			'click': 'action'
		},

		messageResume: 'Resume this item',
		messagePause: 'Pause this item',

		initialize: function() {
			var self = this;

			this.model.on('change:status', this.update, this);

			if(this.isPaused()) {
				this.$el.addClass('enabled');
			}

			var message = (this.isPaused()) ? this.messageResume : this.messagePause;
			this.$el.attr('title', message).tooltip({placement: 'right'});

			this.$el.on('show.bs.tooltip', function() {
				self.tooltip = true;
			}).on('hide.bs.tooltip', function() {
				self.tooltip = false;
			});
		},

		isPaused: function() {
			return (this.model.get('status') == 'Paused')
		},

		action: function() {
			if(!this.$el.hasClass('rotate-icon')) {
				this.$el.addClass('rotate-icon');
				this.updateTooltip('Sending Request');

				var method = this.isPaused() ? 'resume' : 'pause';
				$.getJSON(API_URL + 'queue/' + this.model.id + '/' + method).done(function(data) {
					this.model.forceUpdate().done(function() {
						this.$el.removeClass('rotate-icon');
					}.bind(this));
				}.bind(this));
			}
		},

		update: function(model) {
			if(this.isPaused()) {
				this.$el.addClass('enabled');
			} else {
				this.$el.removeClass('enabled');
			}

			var message = (this.isPaused()) ? this.messageResume : this.messagePause;
			this.updateTooltip(message);
		},

		updateTooltip: function(message) {
			var wasOpened = this.tooltip;
			if(wasOpened) {
				this.$el.tooltip('hide');
			}

			this.$el.attr('data-original-title', message);

			if(wasOpened) {
				this.$el.tooltip('show');
			}	
		}
	});

	var QueueItemProgressView = Backbone.View.extend({
		initialize: function() {

			this.model.on('change:percentage', this.updatePercentage, this);
			this.model.on('change:mbleft', this.updateSizeLeft, this);
			this.model.on('change:mb', this.updateSizeTotal, this);
			this.model.on('change:priority', this.updatePriority, this);
			this.model.on('change:status', this.updatePaused, this);

			this.updatePercentage();
			this.updateSizeLeft();
			this.updateSizeTotal();
			this.updatePriority();
			this.updatePaused();
		},

		getSizeLeft: function() {
			return numeral(this.model.get('mbleft')).format('0,0');
		},
		getSizeTotal: function() {
			return numeral(this.model.get('mb')).format('0,0');
		},

		getPercentage: function() {
			return this.model.get('percentage')
		},

		updatePaused: function() {
			var func = (this.model.get('status') != 'Paused') ? 'addClass' : 'removeClass';
			this.$('.progress')[func]('progress-striped active')
		},

		updatePercentage: function() {
			var percentage = this.getPercentage() + '%';

			this.$('.percentage-text').text(percentage);
			this.$('.progress-bar').css('width', percentage);
		},

		updatePriority: function() {
			var bar = this.$('.progress-bar');

			var className = false;
			switch(this.model.get('priority')) {
				case 'Force':
					className = 'warning';
					break;
				case 'High':
					className = 'success';
					break;
				case 'Low':
					className = 'info';
					break;
			}

			bar.removeClass('progress-bar-success progress-bar-warning progress-bar-info');
			bar.addClass((className) ? 'progress-bar-' + className : '');
		},

		updateSizeLeft: function() {
			this.$('.mb-left').text(this.getSizeLeft() + ' MB');	
		},

		updateSizeTotal: function() {
			this.$('.mb-total').text(this.getSizeTotal() + ' MB');	
		},
	});

	var ListHistoryView = Backbone.View.extend({
		initialize: function() {

		},

		_active: false,
		isActive: function() {
			return this._active;
		},

		activate: function() {
			this._active = true;
			this.$el.slideDown();
		},

		deactivate: function() {
			this._active = false;
			this.$el.slideUp();
		}
	});

	App.View.Panel.SABnzbd = MainView;
})(App, jQuery, _, Backbone, numeral);
