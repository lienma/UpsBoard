define([
	'jquery', 'backbone',

	'tmpl!view/sabnzbd/lists/body',
	'app/collection/sabnzbdqueueslots',
	'app/view/panel/sabnzbd/lists/history/item',

], function($, Backbone, TmplView, Collection, ItemView) {

	var View = Backbone.View.extend({

		initialize: function(options) {

			this.body = options.body;
			this.sabnzbd = options.sabnzbd;

			this.buildView();


			this.slots = new Collection();
			this.slots.isHistory = true;

			this.listenTo(this.slots, 'add', this.addToList);
			this.listenTo(this.slots, 'remove', this.removeFromList);

			this.listenTo(this.model, 'change:slots', function(model) {
				this.slots.set(model.get('slots'));
			}.bind(this));

			this.listenTo(this.model, 'change:noofslots', this.checkReachedMax);

			this.scroll = this._scroll.bind(this);

		},

		buildView: function() {
			this.$el.html(TmplView({emptyMsg: 'Nothing in History'}));
		},

		render: function() {
			return this.$el;
		},

		_active: false,
		isActive: function() {
			return this._active;
		},

		activate: function() {
			this._active = true;

			this.body.scrollTop(0);
			this.$el.slideDown();
			this.startUpdating();
		},

		deactivate: function() {
			this._active = false;

			this.body.off('scroll', this.scroll);

			this.$el.slideUp();
			this.$('.footer').hide();

			this.model.resetLimit();
			this.model.stop();
			this.model.forceOneUpdate();
		},

		startUpdating: function() {
			this.showLoadingIcon();
			this.model.start().done(function() {
				this.$('.footer').show();
				this.hideLoadingIcon();

				this.body.on('scroll', this.scroll);
			}.bind(this));

		},

		hideLoadingIcon: function() {
			this.sabnzbd.Bottombar.historyLoadingIconHide();
		},

		showLoadingIcon: function() {
			this.sabnzbd.Bottombar.historyLoadingIconShow();
		},

		checkReachedMax: function() {
			if(this.model.limit > this.model.get('noofslots')) {
				this.$('.load-more').hide();
			} else {
				this.$('.load-more').show();
			}
		},

		_scroll: function() {
			if(this.isLoadingMore) return;

			if(this.body.scrollTop() >= $(this.$el).height() - this.body.height() - 10) {
				this.isLoadingMore = true;
		
				var newLimit = this.model.limit + 10;
				this.model.setLimit(newLimit);

				this.model.forceUpdate().done(function() {
					this.isLoadingMore = false;

					this.checkReachedMax();
				}.bind(this));
			}
		},

		insertAt: function(index, element) {
			var body = this.$('.table tbody')
			  , lastIndex = body.children().size();

			if(index < 0) {
				index = Math.max(0, lastIndex + 1 + index);
			}

			body.append(element);

			if(index < lastIndex) {
				body.children().eq(index).before(body.children().last());
			}
		},

		addToList: function(model) {
			this.updateEmptyMsg();	

			var index = -1;
			this.slots.each(function(m, i) {
				if(model.id == m.id) {
					index = i;
				}
			});

			model.view = new ItemView({model: model, queueModel: this.model});
			this.insertAt(index, model.view.render());
		},

		removeFromList: function(model) {
			this.updateEmptyMsg();
			model.view.remove();
		},

		updateEmptyMsg: function() {
			if(this.slots.length == 0) {
				this.$('.empty-msg').show();
			} else {
				this.$('.empty-msg').hide();
			}
		},
	});

	return View;
});