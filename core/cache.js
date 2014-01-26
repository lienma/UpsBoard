var fs		= require('fs')
  , moment	= require('moment')
  , path	= require('path')
  , when  	= require('when');

var paths	= require('./../core/paths');

var log		= require(paths.logger)('CACHE')

function Cache(section) {
	if( !(this instanceof Cache) ) {
		return new Cache(section);
	}

	this.section = section;
	this.cache = path.resolve(paths.cache, section);
};

Cache.prototype.getItem = function(filename, fetchItem) {
	var defer = when.defer(), self = this;

	var filePath = this.cache + '/' + filename;
	var exist = fs.existsSync(filePath);

	var logFilename = this.section + '/' + filename;

	log.debug('Is', logFilename.cyan, 'cache?', (exist) ? 'Yes'.green : 'No'.red);
	if(exist) {
		fs.stat(filePath, function(err, stats) {
			if(err)	return fetch();

			var created = moment(stats.mtime);
			var isOld = created.isBefore(created.subtract('days', 7));

			log.debug('Is it older than 7 days?', (isOld) ? 'Yes'.green : 'No'.red);

			if(isOld) {
				fetch();
			} else {
				var file = fs.readFileSync(filePath);

				defer.resolve(file);
			}
		});
	} else {
		fetch();
	}

	function fetch() {
		log.debug('Fetching new item for', logFilename);
		fetchItem().then(function(image) {
			defer.resolve(image);
			save(image);
		}).otherwise(defer.reject);
	}

	function save(file) {
		log.debug('Saving item to cache ', logFilename.cyan + '.');
		fs.writeFileSync(filePath, file);
		return when.resolve(file);
	}

	return defer.promise;
};

module.exports = Cache;
