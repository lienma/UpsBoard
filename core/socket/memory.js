var when = require('when');

module.exports = function(results, socket) {

	if(!socket.user.loggedIn) {
		results = {
			_id:		results._id,
			label:		results.label,
			default:	results.default,
			offline:	(results.offline) ? true : false,
			free:		Math.round(results.free / results.total * 100),
			buffer:		Math.round(results.buffer / results.total * 100),
			cache:		Math.round(results.cache / results.total * 100),
			used: 		Math.round(results.used / results.total * 100)
		};	
	}

	return when.resolve(results);
};

