var Connection 		= require('ssh2')
  , cProcess 		= require('child_process')
  , when 			= require('when')
  , StringDecoder 	= require('string_decoder').StringDecoder
  , path 			= require('path');

var appRoot 		= path.resolve(__dirname, '../')
  , paths 			= require(appRoot + '/core/paths');

var log 			= require(paths.logger)('COMMAND');

function Command(service) {

	var remote = (service);
	var remoteStr = (remote) ? 'remote' : 'local';

	return function(cmd) {
		var promise = when.defer()
		  , refId = new Date().getTime();

		if(this.remote) {
			log.debug('Initializing command on remote server.', '(ref #' + refId + ')');
			service.connect().then(execute).otherwise(function(reason) {

				switch(reason.message) {
					case 'AUTHENTICATION_FAILED':
					case 'CONNECTION_FAILED':
					case 'CONNECTION_TIMEOUT':
					case 'SERVER_OFFLINE':
						log.error('Command failed to sent.', reason.reason, '(ref #' + refId + ')');
						break;
				}

				return promise.reject(reason);
			});
		} else {
			execute(cProcess);
		}

		return promise.promise;

		function execute(processor) {
			log.debug('Excuting command (ref #' + refId + ', ' + remoteStr + '):', cmd.cyan);

			processor.exec(cmd, function(err, stream) {
				if(err) {
console.log('Command Err:'.red, err);
					return promise.reject(err);
				}
				var logMsg = 'Finished executing command.'.yellow + '(ref #' + refId + ', ' + remoteStr + ')';

				if(typeof stream === 'string') {
					log.debug(logMsg);
					promise.resolve(stream);
				} else {
					var decoder = new StringDecoder('utf8')
					  , resStr = '';

					stream.on('data', function(data, extended) {
						 resStr += decoder.write(data);
					});
					stream.on('end', function() {
						log.debug(logMsg);
						promise.resolve(resStr);
					});

					if(remote) {
						stream.on('exit', function(code, signal) {
							processor.end();
						});
					}
				}
			});
		}
	};


}

module.exports = Command;
