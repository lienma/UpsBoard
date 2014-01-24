var when 		= require('when')
  , _ 			= require('underscore');

module.exports 	= function validateGoogleAnalytics(data) {
	if(_.isString(data.data.googleAnalyticsId)) {
		data.config.googleAnalytics = true;
		data.config.googleAnalyticsId = data.data.googleAnalyticsId;
		data.config.googleAnalyticsUrl = data.data.googleAnalyticsUrl;
	} else {
		data.config.googleAnalytics = false;
		data.config.googleAnalyticsId = '';
		data.config.googleAnalyticsUrl = '';
	}
	return when.resolve(data);
};
