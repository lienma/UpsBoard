define([], function() {

	function IntervalTimeout(func, time, force) {
		if(!(this instanceof IntervalTimeout)) {
			return new IntervalTimeout(func, time, force);
		}

		this._timeout		= null;
		this._stopUpdating	= false;
		this.func			= func;
		this.time			= (time) ? time : Config.UpdateDelay;
		this.force			= (force) ? true : false;
	}

	IntervalTimeout.prototype.start = function() { this._call(); };
	IntervalTimeout.prototype.stop = function() { this._stopUpdating = true; };

	IntervalTimeout.prototype._call = function() {
		if(this._timeout != null) {
			clearTimeout(this._timeout);
			this._timeout = null;
		}

		if(this.force || !Config.StopUpdating) {
			this._startTimeout();
		}

		this.func();
	};


	IntervalTimeout.prototype._startTimeout = function() {
		this._timeout = setTimeout(function() {
			this._timeout = null;

			if(this._stopUpdating) {
				this._stopUpdating = false;

				return;
			}

			this._call();
		}.bind(this), this.time);
	};

	return IntervalTimeout;
});