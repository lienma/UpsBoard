var isLoggedIn = Config.IsLoggedIn;
define([
	'backbone',

	(isLoggedIn) ? 'tmpl!view/topbar/user' : 'tmpl!view/topbar/loginform',
	(isLoggedIn) ? 'tmpl!popover/user-menu' : ''


], function(Backbone, TmplTopbarView, TmplUserMenu) {

	var Login = Backbone.View.extend({

		events: {
			'keyup .input-checker': 'keyup'
		},

		initialize: function() {
			this.buildView();

			this.isShowing = false;

			var div = this.$('.login');
			div.hover(function() {
				div.stop(true).animate({opacity: 1}, 500, function() {
					this.isShowing = true;
				}.bind(this));
			}.bind(this), function() {
				if(this.isEmpty()) {
					div.stop(true).animate({opacity: 0.5}, 500, function() {
						this.isShowing = false;
					}.bind(this));
				}
			}.bind(this));

			setTimeout(function() {
				this.$('.login').css('opacity', 1);
				this.keyup();
			}.bind(this), 100);
		},

		buildView: function() {
			this.$el.html(TmplTopbarView());
		},


		isEmpty: function() {
			var $inputs = this.$('.input-checker');
			var isEmpty = true;

			$inputs.each(function() {
				if($(this).val() != '') {
					isEmpty = false;
				}
			});

			return isEmpty;
		},

		isAnyEmpty: function() {
			var $inputs = this.$('.input-checker');
			var isEmpty = false;

			$inputs.each(function() {
				if($(this).val() == '') {
					isEmpty = true;
				}
			});

			return isEmpty;
		},

		keyup: function() {
			var btn = this.$('.btn-login');
			if(!this.isAnyEmpty()) {
				btn.removeClass('btn-default disabled').addClass('btn-success');
			} else {
				btn.removeClass('btn-success').addClass('btn-default disabled');
			}
		}
	});

	var User = Backbone.View.extend({
		initialize: function() {
			this.popoverOpened = false;

			this.buildView();
		},

		buildView: function() {
			this.$el.html(TmplTopbarView());

			this.$('img').popover({
				placement: 'bottom', html: true,
				content: TmplUserMenu()
			});

			$(document).click(function(event) {
				if(this.popoverOpened) {
					var parents = $(event.target).parents();
					if(parents.index(this.$el) == -1) {
						this.$('img').popover('hide');
					}
				}
			}.bind(this));

			this.$('img').on('shown.bs.popover', function() {
				this.popoverOpened = true;
			}.bind(this)).on('hide.bs.popover', function() {
				this.popoverOpened = false;
			}.bind(this));
		}
	});

	return (isLoggedIn) ? User : Login;
});
