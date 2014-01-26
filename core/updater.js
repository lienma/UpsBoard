var paths = require('./paths');

module.exports = function Updater(config) {
	if(!(this instanceof Updater)) {
		return new Updater(config);
	}

	this.enabled = false;
};

