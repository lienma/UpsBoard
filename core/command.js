var cProcess		= require('child_process')
  , fs				= require('fs')
  , path			= require('path')
  , sd				= require('string_decoder').StringDecoder
  , socket			= require('net').Socket
  , ssh				= require('ssh2')
  , when			= require('when')
  , _				= require('underscore');

var appRoot			= path.resolve(__dirname, '../')
  , paths			= require(appRoot + '/core/paths');

var log				= require(paths.logger)('COMMAND');
var Service			= require(paths.core + '/service');

function Command(options) {
	var remote		= _.isObject(options)
	  , strRemote	= (remote) ? 'remote' : 'local'
	  , connect		= (remote) ? new Connect(options) : false;

	return function(cmd) {
		var promise = when.defer()
		  , refId = (new Date().getTime()).toString(36).toUpperCase();

		if(remote) {
			log.debug('Initializing command on remote server.', '(ref #' + refId + ')');
			connect.connect().then(execute).otherwise(function(reason) {

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
			log.debug('Excuting command (ref #' + refId + ', ' + strRemote + '):', cmd.cyan);

			processor.exec(cmd, function(err, stream) {
				if(err) {
console.log('Command Err:'.red, err);
					return promise.reject(err);
				}
				var logMsg = 'Finished executing command.'.yellow + '(ref #' + refId + ', ' + strRemote + ')';

				if(typeof stream === 'string') {
					log.debug(logMsg);
					promise.resolve(stream);
				} else {
					var decoder = new sd('utf8')
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

function Connect(options) {
	var password	= (options.password) ? options.password : false
	  , privateKey	= (options.privateKey) ? fs.readFileSync(options.privateKey) : false
	  , passpharse	= (options.passpharse) ? options.passpharse : false
	  , sshAgent	= (options.sshAgent) ? options.sshAgent : false;

	this.host		= options.host;
	this.port		= options.port;
	this.username	= options.username;
	var hostString	= this.host + ':' + this.port;
	this.strHost	= hostString.yellow;

	this.service = new Service(this.host, this.port);

	this.connect = function() {
		var promise = when.defer();
		log.debug('Testing to see if server,', this.strHost, 'is online');

		this.service.isOnline().then(function(online) {
			if(online) {
				var conn = new ssh(), sock = new socket();
				sock.setTimeout(10000, function() {
					var erro = new Error('CONNECTION_TIMEOUT');
					erro.reason = 'Connection to ' + this.strHost + ' has timed out!';
					promise.reject(erro);
					sock.destroy();
				});

				sock.setNoDelay(true);
				sock.setMaxListeners(0);
				sock.connect(this.port, this.host);

				var cred = { username: this.username, sock: sock };
				if(password) {
					cred.password = password;
				} else if(privateKey) {

				} else if(sshAgent) {
					cred.agent = sshAgent;
				}

				conn.on('error', onError.bind(this));
				conn.on('ready', function() {
					log.debug('Connection made to server', this.strHost);
					promise.resolve(conn);
				}.bind(this));
				conn.connect(cred);
			} else {
				var err = new Error('SERVER_OFFLINE');
				err.reason = 'Could not reach ' + this.strHost;
				log.error('Failed to connection to server', this.strHost);
				promise.reject(err);
			}
		}.bind(this)).otherwise(promise.reject);
		return promise.promise;

		function onError(err) {
			var error = false;
			if(err.level == 'authentication') {
				var erro = new Error('AUTHENTICATION_FAILED');
				erro.reason = 'Authentication to ' + this.strHost + ' failed!';
			}

			if(err.code == 'ECONNREFUSED') {
				var erro = new Error('CONNECTION_FAILED');
				erro.reason = 'Connection to ' + this.strHost + ' failed!';
			}

			if(erro) {
				return promise.reject(erro);
			}
		
			promise.reject(err);
		}
	};
};

module.exports = Command;
