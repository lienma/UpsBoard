var _ = require('underscore');

var Common = module.exports = {

	bytesRegEx: /(\d+)(\s*)(EB|EiB|PB|PiB|TB|TiB|GB|GiB|MB|MiB|KB|KiB|B*)/,
	getBytes: function(sizeStr) {

		var find = String(sizeStr).match(Common.bytesRegEx);

		if(_.isEmpty(find[3])) {
			return find[1];
		} else {
			var power;
			switch(find[3]) {
				case 'EiB':
				case 'EB':
					power = 6;
					break;
				case 'PiB':
				case 'PB':
					power = 5;
					break;
				case 'TiB':
				case 'TB':
					power = 4;
					break;
				case 'GiB':
				case 'GB':
					power = 3;
					break;
				case 'MiB':
				case 'MB':
					power = 2;
					break;
				case 'KiB':
				case 'KB':
					power = 1;
					break;
			}

			var bytes = (power == 0) ? 1 : Math.pow(1024, power);
			return parseFloat(find[0]) * bytes;
		}
	},

	copyProps: function(properties, to, from) {
		properties.forEach(function(prop) {
			to[prop] = from[prop];
		});
	}

};

