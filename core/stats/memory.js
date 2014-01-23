var exec 	= require('child_process').exec
  , when 	= require('when');

module.exports = function getMemory(req) {
	if(req.app.isMacOs) {
		return when.resolve({
			free:	0,
			buffer:	0,
			cache:	0,
			used: 	0
		});
	}

	var promise = when.defer();
	exec('free', function(err, stdout, stderr) {
		var search = /[\s\n\r]+/g, s = ' ';

		var lines = stdout.split('\n');
		var str_mem_info = lines[1].replace(search, s);
		var str_swap_info = lines[3].replace(search, s);
		var mem_info = str_mem_info.split(s);
		var swap_info = str_swap_info.split(s);
      
		var data = {
			total: 	parseInt(mem_info[1]) * 1024,
			free:	parseInt(mem_info[3]) * 1024,
			buffer:	parseInt(mem_info[5]) * 1024,
			cache:	parseInt(mem_info[6]) * 1024
		};

		data.used = (parseInt(mem_info[2]) * 1024) - data.buffer - data.cache;

		promise.resolve(data);
	});

	return promise.promise;
};


