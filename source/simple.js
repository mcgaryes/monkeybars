/**
 * The simplest form of a __MonkeyBars__ task. Once started the task executes all
 * functionality located within the `performTask` function block. Set `logLevel`
 * to see console logs during task execution.
 *
 * @extends Object
 * @constructor
 * @class Task
 * @param {Object} attributes List of attributes to apply to the task
 * @example
 *
 *	var task = new MonkeyBars.Task({
 *		name:"ExampleTask",
 *		performTask:function(){
 *			this.complete();
 *		},
 *		onComplete:function(){
 *			alert(this.name + " is complete!");
 *		}
 *	});
 *	task.start();
 *
 */
var Task = MonkeyBars.Task = function(attributes) {

	var task = this;
	task.tid = generateUniqueId();

	// add our attributes
	for(var attribute in attributes) {
		if(attributes.hasOwnProperty(attribute)) {
			var option = true;
			for(var i = 0; i < taskOptions.length; i++) {
				// @TODO: Need to add functionality here to make sure that the options passed
				// match up to their type
				if(attribute === taskOptions[i] || typeof(attributes[attribute]) === "function") {
					option = false;
					break;
				}
			}
			if(option) {
				if(task.options === undefined) {
					task.options = {};
				}
				task.options[attribute] = attributes[attribute];
			} else {
				if(!task.hasOwnProperty(attribute)) {
					task[attribute] = attributes[attribute];
				}
			}
		}
	}

	// decorate our task
	decorateTaskBasedOnAttributes(task, attributes);

	// initialize the task
	task.initialize(task.options);
};

Task.prototype = Object.create(TaskEvents, {
	
	// ===================================================================
	// === Task Private Properties =======================================
	// ===================================================================

	/**
	 * The current state of the task
	 *
	 * @for Task
	 * @property state
	 * @type Integer
	 * @private
	 */
	_state: {
		value: STATE_INITIALIZED
	},

	// ===================================================================
	// === Task Public Properties ========================================
	// ===================================================================

	/**
	 * Whether or not to run the task concurrently through Web Workers
	 *
	 * @for Task
	 * @property concurrent
	 * @type Boolean
	 * @default false
	 */
	concurrent: {
		value: false
	},

	/**
	 * The default logging level for tasks
	 *
	 * @for Task
	 * @property logLevel
	 * @type Integer
	 * @default 0
	 */
	logLevel: {
		value: LOG_NONE,
		writable: true
	},
	
	/**
	 * Time in milliseconds in which a task will time out and throw a fault
	 *
	 * @for Task
	 * @property timeout
	 * @type Integer
	 * @default undefined
	 */
	timeout: {
		value: undefined,
		writable: true
	},
	
	/**
	 * The kind of task
	 *
	 * @for Task
	 * @property type
	 * @type String
	 * @readonly
	 */
	type: {
		value: TYPE_SIMPLE
	},
	
	/**
	 * This object can either be simply a reference to a custom WorkerTask extention's
	 * constructor. Or it can be an object with a constructor key/value pair. If it is the
	 * latter then you also have the option of passing a handler function that will be run
	 * on the `onMessage` handler of the Worker itself.
	 *
	 * @for Task
	 * @property worker
	 * @type Object
	 * @default undefined
	 * @example
	 *
	 *	var task = new MonkeyBars.Task({
	 *		...
	 *		worker:{
	 *			constructor:CustomWorker,
	 *			handler:function(e){
	 *				// called when a postMessage is posted from the task
	 *			}
	 *		},
	 *		...
	 *	});
	 *
	 *	var task = new MonkeyBars.Task({
	 *		...
	 *		worker:CustomWorker,
	 *		...
	 *	});
	 *
	 */
	worker: {
		value: undefined
	},

	// ===================================================================
	// === Task Private Methods ==========================================
	// ===================================================================

	/**
	 * This method is called during the execution lifecycle of the task. It is intentionally
	 * left blank and is up to the instance to describe it functionality.
	 * @for Task
	 * @method __onStateChange
	 * @param {Integer} state The current state of the task
	 * @param {String} error Message describing error
	 * @private
	 */
	__onStateChange: {
		value: function(state, error) {}
	},

	// ===================================================================
	// === Task Public Methods ===========================================
	// ===================================================================

	/**
	 * Calling this method cancels the task. However it is up to the instance to handle
	 * the canceled state.
	 *
	 * @for Task
	 * @method cancel
	 * @example
	 *
	 *	var task = new MonkeyBars.Task({
	 *		performTask:function(){
	 *			if(true){
	 *				this.cancel();
	 *			}
	 *		}
	 *	});
	 *
	 *	task.start();
	 *
	 */
	cancel: {
		value: function() {
			if(this._state > STATE_STARTED) {
				return;
			}
			this._state = STATE_CANCELED;
			if(this.logLevel >= LOG_INFO) {
				log("Canceled: " + this.displayName);
			}
			if(this.timeoutId) {
				clearTimeout(this.timeoutId);
			}
			this.trigger("cancel");
			this.__onStateChange(this._state);
			this.onCancel();
		}
	},

	/**
	 * Calling this method says that the tasks execution is now complete.
	 *
	 * @for Task
	 * @method complete
	 * @param {Object} data
	 * @param {String} operation
	 * @example
	 *	var task = new MonkeyBars.Task({
	 *		performTask:function(){
	 *			this.complete();
	 *		}
	 *	});
	 *	task.start();
	 */
	complete: {
		value: function(data) {
			if(this._state > STATE_STARTED) {
				return;
			}
			this._state = STATE_COMPLETED;

			if(this.logLevel >= LOG_INFO) {
				log("Completed: " + this.displayName);
			}

			// clear the timeout interval if we actually had one
			if(this.timeoutId) {
				clearTimeout(this.timeoutId);
			}
			
			// run the data operation
			if(arguments.length !== 0) {
				this.operate(data,this);
			}

			// call completion methods
			this.trigger("complete");
			this.onComplete();
			this.__onStateChange(this._state);
		}
	},

	/**
	 * @for Task
	 * @function destroy
	 */
	destroy:{
		value:function(){
			for(var prop in this) {
				if(this.hasOwnProperty(prop)){
					delete this[prop];
				}
			}
		}
	},

	/**
	 * Display name for task. Used in logging output.
	 *
	 * @for Task
	 * @property displayName
	 * @type String
	 * @readonly
	 */
	displayName: {
		get: function() {
			if(this.name) {
				return this.name;
			} else {
				return this.type + ":" + this.tid;
			}
		}
	},

	/**
	 * Calling this method to fault a task. If it is part of a group task this will
	 * also call the groups fault method passing the error up to the group.
	 *
	 * @for Task
	 * @method fault
	 * @param {String} error Message associated with the cause of the fault.
	 * @example
	 *
	 *	var task = new MonkeyBars.Task({
	 *		performTask:function(){
	 *			var a = "a";
	 *			if(a != "b") {
	 *				this.fault("a != b");
	 *			}
	 *		}
	 *	});
	 *
	 *	task.start();
	 *
	 */
	fault: {
		value: function(error) {
			if(this._state >= STATE_CANCELED) {
				return;
			}			this._state = STATE_FAULTED;
			if(this.logLevel >= LOG_INFO) {
				log("Faulted: " + this.displayName);
			}
			if(this.timeoutId) {
				clearTimeout(this.timeoutId);
			}
			this.trigger("fault");
			this.__onStateChange(this._state, error);
			this.onFault(error);
		}
	},
	
	/**
	 * Initialization functionality
	 *
	 * @for Task
	 * @method initialize
	 * @param {Object} attributes
	 */
	initialize: {
		value: function(attributes) {}
	},
	
	/**
	 * Convenience method called when the task is canceled.
	 *
	 * @for Task
	 * @method onCancel
	 */
	onCancel: {
		value: function() {}
	},
	
	/**
	 * Convenience method called when the task completes.
	 *
	 * @for Task
	 * @method onComplete
	 */
	onComplete: {
		value: function() {}
	},

	/**
	 * Convenience method called when the task faults.
	 *
	 * @for Task
	 * @method onFault
	 * @param {String} error Message describing error
	 */
	onFault: {
		value: function(error) {}
	},
	
	/**
	 * Convenience method called when the task starts.
	 *
	 * @for Task
	 * @method onStart
	 */
	onStart: {
		value: function() {}
	},
	
	/**
	 * @method operate
	 * @param {Object} data
	 * @param {Task} task
	 */
	operate:{
		value:function(data, task){
			this.data = data;
		}
	},

	/**
	 * This method is required for **simple** tasks and will throw an exception if it
	 * is called and not overridden. If you overwrite this method on a task group
	 * then you need to make sure that you call the extended/implemented classes
	 * original prototype method (see the example below).
	 *
	 * @for Task
	 * @method performTask
	 * @required
	 * @example
	 *
	 *	var parallel = new MonkeyBars.ParallelTask({
	 *		...
	 *		performTask:function(){
	 *			// custom functionality
	 *			MonkeyBars.ParallelTask.prototype.performTask.call(this);
	 *		}
	 *		...
	 *	})
	 *
	 */
	performTask: {
		value: function() {
			throw "performTask: " + OVERRIDE_NEEDED;
		}
	},
	
	/**
	 * Resets a task to its original state
	 *
	 * @for Task
	 * @method reset
	 */
	reset:{
		value:function(){
			this._state = STATE_INITIALIZED;
			this.processed = false;
		}
	},

	/**
	 * Kicks off the execution of the task by calling the tasks `performTask` method.
	 * This method can only be run once on a task.
	 *
	 * @for Task
	 * @method start
	 */
	start: {
		value: function() {
			if(this._state >= STATE_STARTED) {
				return;
			}

			this._state = STATE_STARTED;
			if(this.logLevel >= LOG_INFO) {
				log("Started: " + this.displayName);
			}
			if(this.timeout !== undefined) {
				var delegate = this;
				this.timeoutId = setTimeout(function() {
					delegate.fault();
				}, this.timeout);
			}
			this.trigger("start");
			this.__onStateChange(this._state);
			if(this.concurrent) {
				performTaskFunctionalityWithWebWorker(this);
			} else {
				this.performTask();
			}

			this.onStart();
		}
	},

	/**
	 * Getter for the tasks current state. Code outside of an implementation should not set the 
	 * state as this is an internal property.
	 * @method state
	 * @return {Integer} The current state of the task
	 */
	state:{
		get:function(){
			return this._state;
		}
	}
});

Task.extend = extend;