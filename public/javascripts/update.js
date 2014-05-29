var url = window.location.protocol + '//' + window.location.host + Config.WebRoot;
var alive = url + '/alive';
var currentPid = '';

function check() {
console.log(alive);
	$.get(alive, function(data) {
		if(currentPid == '' || currentPid == data.pid) {
			currentPid = data.pid;
			setTimeout('check()', 1000);
		} else {
			window.location.href = url;
		}
	}).fail(function() {
		console.log('Failed! Going to check again in a second.');
		setTimeout('check()', 1000);
	});
}

$(document).ready(function() { check(); });
