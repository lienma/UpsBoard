define([
	'backbone',

	'tmpl!view/sabnzbd/lists/body',

	'app/collection/sabnzbdqueueslots',

	'app/view/panel/sabnzbd/lists/queue/item',

	'jquery.tablednd'

], function(Backbone, TmplView, SlotsCollection, ItemView) {

	var View = Backbone.View.extend({

		initialize: function(options) {

			this.body = options.body;
			this.sabnzbd = options.sabnzbd;

			this.slots = new SlotsCollection();
			this.slots.forceUpdate = this.model.forceUpdate.bind(this.model);

			this.buildView();

			this.listenTo(this.slots, 'add', this.queueAddItem);
			this.listenTo(this.slots, 'remove', this.queueRemoveItem);

			this.listenTo(this.model, 'change:noofslots', this.updateNumOfSlots);
			this.listenTo(this.model, 'change:slots', function(model) {
				this.slots.set(model.get('slots'));
			}.bind(this));

			this.$('table').tableDnD({
				dragHandle: '.drag-handle',

				onDragClass: 'dragging-row',
				onDrop: this.onDrop.bind(this)	
			});

			this.scroll = this._scroll.bind(this);
			this.resize = this._resize.bind(this);

			this.body.on('scroll', this.scroll);
			$(window).on('resize', this.resize);
		},

		buildView: function() {
			this.$el.html(TmplView({emptyMsg: 'Queue is Empty'}));
		},

		activate: function() {
			this._active = true;

			this.body.scrollTop(0);

			this.$el.slideDown(function() {
				this.body.on('scroll', this.scroll);
				$(window).on('resize', this.resize);
			}.bind(this));

			this.model.forceUpdate();
			this.resize();
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

		deactivate: function() {
			this._active = false;

			this.body.off('scroll', this.scroll);
			$(window).off('resize', this.resize);

			this.$el.slideUp();
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

		_active: true,
		isActive: function() {
			return this._active;
		},

		onDrop: function(table, row) {
			var nzbId = $(row).data('nzb');
			var position = this.getIndexById(nzbId);

			if(position != this.slots.get(nzbId).get('index')) {
				$.getJSON(Config.WebRoot + '/api/sabnzbd/queue/' + nzbId + '/move/' + position);
			}

			this.resetRowColors();
		},

		queueAddItem: function(model) {
			model.view = new ItemView({model: model, queueModel: this.model});
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

			this.updateEmptyMsg();
			this.$('table').tableDnDUpdate();
			this.resetRowColors();
			this.resize();
			this.listenTo(model, 'change:index', this.changeItemPosition);
		},

		queueRemoveItem: function(model) {
			model.view.removeViews();
			model.view.remove();
			this.updateEmptyMsg();
		},

		render: function() {
			return this.$el;
		},

		resetRowColors: function() {
			this.$('tr.item-row').removeClass('alt');
			this.$('tr.item-row:odd').addClass('alt');
		},

		updateEmptyMsg: function() {
			if(this.slots.length == 0) {
				this.$('.empty-msg').fadeIn();
			} else {
				this.$('.empty-msg').fadeOut();
			}
		},

		updateNumOfSlots: function() {
			var num = this.model.get('noofslots');
			if(this.model.limit > num) {
				this.$('.load-more').hide();
			} else {
				this.$('.load-more').show();
			}
		},

		_resize: function() {
			if(!this.sabnzbd.isLoaded()) return;

			var width = this.$('td.middle').width();
			width = Math.floor(width / 4) - 8;
			this.$('.select-event').css('width', width + 'px');
		},

		_scroll: function() {
			if(this.isLoadingMore) return;

			if(this.body.scrollTop() >= $(this.$el).height() - this.body.height() - 10) {
				this.isLoadingMore = true;
		
				var newLimit = this.model.limit + 10;
				this.model.setLimit(newLimit);

				this.model.forceUpdate().done(function() {
					this.isLoadingMore = false;

					this.updateNumOfSlots();
				}.bind(this));
			}
		}
	});

	return View;
});
