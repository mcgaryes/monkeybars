/**
 * Creates a new worker representation of the task
 *
 * @extends Object
 * @constructor
 * @class WorkerTask
 * @param {Task} task The task we're creating this worker representation from
 * @example
 *
 *	var CustomWorker = MonkeyBars.WorkerTask.extend({
 *		append:function(data){
 *			this.postMessage("append",100);
 *		},
 *		devide:function(data){
 *			this.postMessage("devide",2);
 *			this.complete(data/2);
 *		}
 *	});
 *
 *	var task = new MonkeyBars.Task({
 *		...
 *		concurrent:true,
 *		worker:{
 *			constructor:CustomWorker,
 *			handler:function(e){
 *				if(e.data.type === "append") {
 *					...
 *				} else if(e.data.type === "devide") {
 *					...
 *				}
 *			}
 *		}
 *		...
 *	});
 *
 *	task.start();
 *
 */
var WorkerTask = MonkeyBars.WorkerTask = function(task) {
	if(!task) {
		throw INVALID_ARGUMENTS;
	}
	if(task.data !== undefined) {
		this.data = task.data;
	}
	this.performTask = task.performTask;
};

WorkerTask.prototype = {

	/**
	 * Post a complete message along with the data passed stating that the task
	 * has completed what it needs to.
	 *
	 * @for WorkerTask
	 * @method complete
	 */
	complete: function(data) {
		this.postMessage("complete", data);
	},

	/**
	 * Posts a fault message to the main thread that the task has faulted. Passes
	 * an error as its value.
	 *
	 * @for WorkerTask
	 * @method fault
	 * @param {Object} error
	 */
	fault: function(error) {
		this.postMessage("fault", error);
	},

	/**
	 * Posts a cancel message to the main thread that the task has been canceled.
	 *
	 * @for WorkerTask
	 * @method cancel
	 */
	cancel: function() {
		this.postMessage("cancel");
	},

	/**
	 * Convenience method for posting messages to the main thread. You should opt into
	 * using this as it is how the rest of the WorkerTask core methods communicate with
	 * the main thread.
	 *
	 * @for WorkerTask
	 * @method postMessage
	 * @param {String} type
	 * @param {Object} value
	 */
	postMessage: function(type, value) {
		var message = {};
		if(type !== undefined && typeof(type) === "string") {
			message.type = type;
		}
		if(value !== undefined) {
			message.value = value;
		}
		postMessage(message);
	}
};

WorkerTask.extend = extend;