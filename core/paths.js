var path 		= require('path');
var appRoot 	= path.resolve(__dirname, '../');

var paths = module.exports = {
	app: 		appRoot,

	api: 		path.join(appRoot, 'core', 'api'),
	cache:		path.join(appRoot, 'cache'),
	core:		path.join(appRoot, 'core'),
	logs:		path.join(appRoot, 'logs'),
	logger: 	path.join(appRoot, 'core', 'logger'),
	public: 	path.join(appRoot, 'public'),
	stats: 		path.join(appRoot, 'core', 'stats')
};
