define([
	'backbone',
	'app/view/panel/drivespace/item'
], function(Backbone, ItemView) {

	var View = Backbone.View.extend({
		el: 'div.diskSpacePanel',

		initialize: function(CollectionDrives) {
			this.collection = CollectionDrives;
			this.collection.on('add', this.addDrive, this);
		},

		addDrive: function(model) {
			var view = new ItemView({ model: model });
			this.$('ul').append(view.render().css('display', 'none').fadeIn());
		}
	});

	return View;
});
