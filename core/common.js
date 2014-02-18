var _			= require('underscore')
  , path 		= require('path')
  , when		= require('when');

var appRoot 	= path.resolve(__dirname, '../')
  , paths 		= require(appRoot + '/core/paths');

var Common = module.exports = {

	bytesRegEx: /(\d+)(\s*)(EB|EiB|PB|PiB|TB|TiB|GB|GiB|MB|MiB|KB|KiB|B*)/,
	getBytes: function(sizeStr) {

		var find = String(sizeStr).match(Common.bytesRegEx);

		if(_.isEmpty(find[3])) {
			return find[1];
		} else {
			var power;
			switch(find[3]) {
				case 'EiB':
				case 'EB':
					power = 6;
					break;
				case 'PiB':
				case 'PB':
					power = 5;
					break;
				case 'TiB':
				case 'TB':
					power = 4;
					break;
				case 'GiB':
				case 'GB':
					power = 3;
					break;
				case 'MiB':
				case 'MB':
					power = 2;
					break;
				case 'KiB':
				case 'KB':
					power = 1;
					break;
			}

			var bytes = (power == 0) ? 1 : Math.pow(1024, power);
			return parseFloat(find[0]) * bytes;
		}
	},

	copyProps: function(properties, to, from) {
		properties.forEach(function(prop) {
			to[prop] = from[prop];
		});
	},

	validateRemoteHost: function(data) {
		if(!data.server.remote) {
			data.options.remote = false;
			return when.resolve(data);
		}

		var log = require(paths.logger)('REMOTE_VALIDATION');

		var remote = {
			host: (_.isString(data.server.host)) ? data.server.host : 'localhost',
			port: (_.isNumber(data.server.port)) ? data.server.port : 22
		};

		var os = ((data.server.os) ? data.server.os : 'linux').toLowerCase();
		if(!/linux|mac/.test(os)) {
			var err = new Error('INVALID_CONFIG');
			err.reason = 'The operating system, ' + os + ', is not supported at this time.';
			return when.reject(err);
		}
		remote.os = os;

		if(!_.isString(data.server.username) || _.isEmpty(data.server.username)) {
			var err = new Error('USERNAME');
			err.options = options;
			return when.reject(err);
		}
		remote.username = data.server.username;

		if(_.isString(data.server.password)) {
			log.debug('Using password authentication');
			remote.password = data.server.password;
		} else if(_.isString(data.server.privateKey)) {
			log.debug('Using private key authentication');

			var defer = when.defer();
			return defer.promise;
		} else if(data.server.sshAgent) {
			log.debug('Using an agent for authentication');

			var agent = require(appRoot + '/node_modules/ssh2/lib/agent');
			var agentPath = _.isString(data.server.sshAgent) ? data.server.sshAgent : process.env.SSH_AUTH_SOCK;
			var defer = when.defer();

			log.debug('Checking if agent exists.');
			agent(agentPath, function(err, keys) {
				if(err) {
					var err = new Error('SSH_AGENT_NOT_FOUND');
					err.reason = 'SSH Agent was not found. Please start ssh-agent and restart the app.';
					return defer.reject(err);
				}

				if(keys.length == 0) {
					var err = new Error('SSH_AGENT_NO_KEYS');
					err.reason = 'No keys found in ssh agent! Add some keys and restart the app.';
					return defer.reject(err);
				}

				remote.sshAgent = agentPath;
				data.options.remote = remote;
				defer.resolve(data);
			});
			return defer.promise;
		} else {
			var err = new Error('NO_AUTHENTICATION');
			err.options = options;
			return when.reject(err);
		}


		data.options.remote = remote;
		return when.resolve(data);
	}
};

