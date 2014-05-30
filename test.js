var colors			= require('colors')
  , path			= require('path');

var appRoot			= path.resolve(__dirname)
  , paths			= require(appRoot + '/core/paths')
  , Updater			= require('./core/updater');

var app = {
	config: {
		checkForUpdates: true
	},

	dir: appRoot
};

var updater = new Updater(app);

updater.status.then(function() {
	return updater.checkForUpdate();
}).then(function(update) {

console.log("Need Update?".red, (update ? 'Yes'.green : 'No'.green));

	//if(update) {
		updater.doUpdate();
	//}
});
