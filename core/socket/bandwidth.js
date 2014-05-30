var when = require('when');

function copyProps(properties, to, from) {
	properties.forEach(function(prop) {
		to[prop] = from[prop];
	});
}

module.exports = function bandwidth(results, socket) {
	var isLoggedIn = socket.user.loggedIn;
	var data = {};

	copyProps(['_id', 'label', 'default', 'max', 'offline', 'dateSince', 'download', 'upload'], data, results);

	if(results.cap) {
		var action = results.cap[0], limit = results.cap[1];
		var total = 0;
		if(action.indexOf('Download') != -1) {
			total += parseInt(results.thisMonth[0]);
		}

		if(action.indexOf('Upload') != -1) {
			total += parseInt(results.thisMonth[1]);
		}

		data.cap = (isLoggedIn) ? total : Math.round(total / limit * 100);;
		data.capLimit = (isLoggedIn) ? limit : 100;
	} else {
		data.cap = false;
	}

	if(isLoggedIn) {
		copyProps(['total', 'lastMonth', 'thisMonth', 'today'], data, results);
	}

	return when.resolve(data);
	//socket.emit('bandwidth:' + results._id, data);
};

