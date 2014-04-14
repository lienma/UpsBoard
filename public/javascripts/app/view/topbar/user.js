
var isLoggedIn = Config.IsLoggedIn;

define([
	'backbone',

	(isLoggedIn) ? 'tmpl!view/topbar/user' : 'tmpl!view/topbar/loginform',
	(isLoggedIn) ? 'tmpl!popover/user-menu' : ''


], function(Backbone, TmplTopbarView, TmplUserMenu) {

	var Login = Backbone.View.extend({
		initialize: function() {
			this.buildView();
		},

		buildView: function() {
			this.$el.html(TmplTopbarView());
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
