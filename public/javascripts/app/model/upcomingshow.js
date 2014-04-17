define([
	'backbone', 'moment'
], function(Backbone, moment) {

	var Model = Backbone.Model.extend({
		idAttribute: '_id',

		defaults: {
			'airs': '00:00'
		},

		moment: function() {
			var airs = this.get('airs')
			  , date = this.get('airdate');

                airs = (airs) ? airs : '00:00';

			var epTime = airs.match(/(\d+):(\d+)(\s*)(\w*)/);
			var time = parseInt(epTime[1] + '' + epTime[2]);
			    time = (epTime[4] == 'PM') ? 1200 + time : time;
			    time = String((time.length == 3) ? '0' + time : time);


			var hours = parseInt(time.substr(0, 2)), minutes = time.substr(2, 4);

			var ampm = 'AM';
			if(hours > 12) {
				hours -= 12;
				ampm = 'PM';
			}

			return moment(date + ' ' + hours + ':' + minutes + ' ' + ampm, 'YYYY-MM-DD h:mm A');
		}
	});

	return Model;
});