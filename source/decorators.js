/**
 * Decorator to provide for loop functionality for the task. The task executes
 * as many times as referenced by the count attribute provided by the instance.
 *
 * @for MonkeyBars
 * @method forTaskDecorator
 * @param {Object} task
 * @private
 */
var forTaskDecorator = function(task) {
	task.itterationIndex = 0;
	task.complete = function() {
		if(this.itterationIndex !== this.count - 1) {
			this.reset();
			this.itterationIndex++;
			if(this.logLevel >= LOG_INFO) {
				log("Completed:" + this.displayName + " " + this.itterationIndex + " out of " + this.count + " times");
			}
			this.performTask();
		} else {
			Task.prototype.complete.call(this);
		}
	};
};

/**
 * Decorator to provide while loop functionaliy. The task executed until the `while`
 * method returns false.
 *
 * @for MonkeyBars
 * @method whileTaskDecorator
 * @param {Object} task
 * @private
 */
var whileTaskDecorator = function(task) {
	task.interval = task.interval ? task.interval : TIMEOUT_INTERVAL;
	task.complete = function() {
		if(this.doWhile()) {
			this._state = STATE_INITIALIZED;
			var delegate = this;
			if(this.interval !== 0) {
				setTimeout(function() {
					delegate.reset();
					delegate.start();
				}, this.interval);
			} else {
				delegate.start();
			}

		} else {
			Task.prototype.complete.call(this);
		}
	};
};

/**
 * The task doesnt execute until the when method provided returns true.
 *
 * @for MonkeyBars
 * @method whenTaskDecorator
 * @param {Object} task
 * @private
 */
var whenTaskDecorator = function(task) {
	task.interval = task.interval ? task.interval : TIMEOUT_INTERVAL;
	task.start = function() {
		var delegate = this;
		var interval = setInterval(function() {
			if(delegate.when()) {
				Task.prototype.start.call(delegate);
				clearInterval(this);
			}
		}, this.interval);
	};
};