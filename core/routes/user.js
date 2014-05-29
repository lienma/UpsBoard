var request	= require('request')
  , path	= require('path')
  , fs		= require('fs');

var appRoot	= path.resolve(__dirname, '../../')
  , paths	= require(appRoot + '/core/paths')
  , log 	= require(paths.logger)('AVATAR');

exports.avatar = function(req, res, next) {
	var avatar = req.app.config.user.avatar;

	
	log.debug('Getting avatar. Avatar is', ((avatar == 'url') ? 'remote' : 'local'));
	if(avatar == 'url') {
		log.debug('Avatar remote location:', req.app.config.user.avatarUrl);
		res.writeHead(200, {'Cache-Control': 'no-cache'});
		req.pipe(request(req.app.config.user.avatarUrl)).pipe(res);
	} else {
		avatar = (avatar != '' && fs.existsSync(appRoot + avatar)) ? appRoot + avatar : paths.public + '/images/default-avatar.png';

		log.debug('Avatar local location:', avatar);

		res.sendfile(avatar);
	}
};
