define([
	'jquery', 'backbone',

	'tmpl!view/sabnzbd/lists/queue-item',
	'app/view/panel/sabnzbd/lists/queue/item/pause',
	'app/view/panel/sabnzbd/lists/queue/item/progress',

	'app/view/panel/sabnzbd/modal/deletenzb',

	'app/func/tooltip',
	'bootstrap'
], function($, Backbone, TmplView, PauseView, ProgressView, ModalDeleteNzb, Tooltip) {

	var View = Backbone.View.extend({
		tagName: 'tr',

		events: {
			'change .select-event': 'eventSelects',
			'click .btn-delete-nzb': 'clickDeleteNzb'
		},

		initialize: function(options) {
			this.queueModel = options.queueModel;
			this.$el.attr('id', this.model.get('index') + 1).addClass('item-row');

			this.buildView();
			this.setOnChange();

			this.modalDeleteNzb = new ModalDeleteNzb();

			this.listenTo(this.modalDeleteNzb, 'delete', this.deleteNzbAction);

			this.listenTo(this.queueModel, 'change:scripts', this.createSelectScript);
			this.listenTo(this.queueModel, 'change:categories', this.createSelectCategories);

			this.viewPause = new PauseView({el: this.$('.queue-item-pause'), model: this.model});
			this.viewProgress = new ProgressView({el: this.$el, model: this.model});
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

			this.$el.html(TmplView(templateObj));

			this.tooltips = {
				filename: new Tooltip({
					el: this.$('.filename-text'),
					title: 'Age: ' + this.model.get('avg_age')
				}),

				deleteNzb: new Tooltip({el: this.$('.btn-delete-nzb')})
			}

			this.$('[rel=tooltip]').tooltip();

			this.createMenu();
			this.createSelectCategories();
			this.createSelectScript();

			this.updateSelectPriority();
			this.updateSelectProcessing();

			this.setOnChange();

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
				this.modalDeleteNzb.open();
			}
		},

		createMenu: function() {
			var menu = $(this.$('.menu'));
			this.$el.hover(function(event) {
				menu.slideDown('fast');
			}, function(event) {
				menu.slideUp('fast');
			});
		},

		createSelectCategories: function() {
			var categories = this.queueModel.get('categories');
			var select = this.$('.category-select').empty();
			categories.forEach(function(category) {
				var option = new Option(category, category, false, (this.model.get('cat') == category));

				select.append(option);
			}.bind(this));
		},

		createSelectScript: function() {
			var scripts = this.queueModel.get('scripts');
			var select = this.$('.scripts-select').empty();
			scripts.forEach(function(script) {
				var option = new Option(script, script, false, (this.model.get('script') == script));

				select.append(option);
			}.bind(this));
		},

		deleteNzbAction: function(deleteFiles) {
			var icon = this.$('.icon-delete-nzb');

			if(!icon.hasClass('rotate-icon')) {
				icon.addClass('rotate-icon');

				this.tooltips.deleteNzb.update('Sending Request');

				this.model.call('delete', deleteFiles).done(function(data) {
console.log(data);
				}.bind(this));
			}
		},

		eventSelects: function(event) {
			var element	= $(event.target)
			  , type	= element.data('type')
			  , value	= element.val()
			  , field	= element.data('field');

			this.model.call(type, String(value).toLowerCase()).done(function(data) {
				this.model.set(field, value);
				if(type == 'priority') {
					this.model.set('index', data.position);
				}
			}.bind(this));
		},

		removeViews: function() {
			this.viewPause.remove();
			this.viewProgress.remove();
		},

		render: function() {
			return this.$el;
		},

		setOnChange: function() {
			var fields = ['filename', 'status', 'cat'];
			fields.forEach(function(field) {
				this.listenTo(this.model, 'change:' + field, function(m) {
					this.$('.' + field + '-text').text(m.get(field));
				}.bind(this));
			}.bind(this));

			this.listenTo(this.model, 'change:cat', this.updateSelectCategory);
			this.listenTo(this.model, 'change:priority', this.updateSelectPriority);
			this.listenTo(this.model, 'change:script', this.updateSelectScript);
			this.listenTo(this.model, 'change:unpackopts', this.updateSelectProcessing);
			this.listenTo(this.model, 'change:avg_age', this.updateNzbTooltip);
		},

		updateNzbTooltip: function() {
			this.tooltips.filename.update('Age: ' + this.model.get('avg_age'));
		},

		updateSelectCategory: function() {
			this.selectVal('.category-select', this.model.get('cat'));
		},

		updateSelectPriority: function() {
			this.selectVal('.priority-select', this.model.get('priority'));
		},

		updateSelectProcessing: function() {
			this.selectVal('unpackopts-select', this.model.get('unpackopts'));
		},

		updateSelectScript: function() {
			this.selectVal('.scripts-select', this.model.get('script'));
		},

		selectVal: function(options, value) {
			this.$(options + ' option').each(function() {
				this.selected = (this.value == value);
			});
		}
	});

	return View;
});