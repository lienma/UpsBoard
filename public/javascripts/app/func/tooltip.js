define([
	'jquery', 'bootstrap'
], function() {

	function Tooltip(options) {
		if(!(this instanceof Tooltip)) {
			return new Tooltip(options);
		}

		this.el = $(options.el);
		this._showing = false;

		if(options.title) {
			this.el.attr('title', options.title);
		}

		this.options = {
			placement: options.placement,
			html: options.html
		};

		this.el.on('show.bs.tooltip', function() {
			this._showing = true;
		}.bind(this));

		this.el.on('hide.bs.tooltip', function() {
			this._showing = false;
		}.bind(this));

		this.el.tooltip(this.options);
	}

	Tooltip.prototype.update = function(title) {
		var wasOpened = this._showing;

		this.el.attr('data-original-title', title);
		if(wasOpened){
			this.el.tooltip('show');
		}
	};

	return Tooltip;
});