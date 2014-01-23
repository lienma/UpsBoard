var os 		= require('os')
  , when 	= require('when');

function getAvgCPU(oldCpus, newCpus, avgType) {
	var average = 0;
	for(var i = 0, len = oldCpus.length; i < len; i++) {
		for(type in oldCpus[i]) {
			if(type == avgType) {
				var total = newCpus[i].total - oldCpus[i].total;
				var difference = newCpus[i][type] - oldCpus[i][type];
				var avg = Math.round(10000 * (difference / total)) / 100;
				average += avg;
			}
		}
	}
	return Math.round(100 * average) / 100;
}

function getCpuInfo() {
    var cpus = os.cpus();
	var cpuData = [];

	for(var i = 0, len = cpus.length; i < len; i++) {
		var cpu = cpus[i], total = 0;
		var cpuArray = {};

		for(type in cpu.times)
			total += cpu.times[type];

		for(type in cpu.times) {
			cpuArray[type] = cpu.times[type];
		}
		cpuArray.total = total;
		cpuData.push(cpuArray);
	}

	return cpuData;
}

module.exports = function getCpu() {
	var promise = when.defer()
	  , now 	= getCpuInfo();

	setTimeout(function() {
		var later 		= getCpuInfo()
		  , totalCPUs 	= os.cpus().length;

		var data = {
			cpu: 		os.cpus()[0].model,
			totalCPUs: 	totalCPUs,
			user: 		getAvgCPU(now, later, 'user'),
			nice: 		getAvgCPU(now, later, 'nice'),
			sys: 		getAvgCPU(now, later, 'sys'),
			idle: 		getAvgCPU(now, later, 'idle'),
			time: 		new Date().getTime(),
			loadAvg: 	os.loadavg()
		};

		promise.resolve(data);

	}, 5000);

	return promise.promise;
}


