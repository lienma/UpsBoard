var request	= require('request')
  , path	= require('path')
  , fs		= require('fs');

var appRoot	= path.resolve(__dirname, '../../')
  , paths	= require(appRoot + '/core/paths')

exports.avatar = function(req, res, next) {
	var avatar = req.app.config.user.avatar;

	res.writeHead(200, {'Cache-Control': 'no-cache'});

	if(avatar == 'url') {
		req.pipe(request(req.app.config.user.avatarUrl)).pipe(res);
	} else {
		avatar = fs.existsSync(avatar) ? appRoot + avatar : paths.public + '/images/default-avatar.png';
		res.sendfile(avatar);
	}
};
