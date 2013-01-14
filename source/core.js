//%pre

"use strict";

// ===================================================================
// === Constants =====================================================
// ===================================================================

var STATE_INITIALIZED = 0;
var STATE_STARTED = 1;
var STATE_CANCELED = 2;
var STATE_FAULTED = 3;
var STATE_COMPLETED = 4;

var TYPE_PARALLEL = "parallel";
var TYPE_SEQUENCE = "sequence";
var TYPE_SIMPLE = "simple";

var LOG_NONE = 0;
var LOG_ERROR = 10;
var LOG_INFO = 20;
var LOG_VERBOSE = 30;

var DECORATOR_FOR = "for";
var DECORATOR_WHEN = "when";
var DECORATOR_WHILE = "while";

var TID_PREFIX = "tid";
var TIMEOUT_INTERVAL = 100;
var OVERRIDE_NEEDED = "This method must be overridden.";
var UNDEFINED_TASK = "Task is undefined.";
var MISSING_ATTRIBUTES = "You must pass some attributes in order to create a task.";
var UNKNOW_TYPE_WITH_OPTIONS = "Unknown task type referenced.";
var INVALID_ARGUMENTS = "Invalid arguments were passed.";
var UNHANDLED_POST_MESSAGE = "Unhandled 'postMessage'";

// ===================================================================
// === Private Variables =============================================
// ===================================================================

/**
 * Reference to the global js object (i.e. brower's window)
 *
 * @property root
 * @type Object
 * @private
 */
var root = this;

/**
 * Counter used to create unique task ids
 *
 * @property taskIdCounter
 * @type Integer
 * @private
 */
var taskIdCounter = 0;

/**
 * List of all whitelisted properties for a task
 *
 * @property taskOptions
 * @type Array
 * @private
 */
var taskOptions = [
	// task
	"name", "tid", "id", "data", "type", "concurrent", "worker", "displayName", "state", "logLevel", "timeout", "dependencies", "group", "processed",
	// group
	"tasks", "currentIndex", "processedIndex", "max", "dependencyMap",
	// decorators
	"count", "interval"
];

/**
 * Object returned by module. Works as namespace for the task library.
 *
 * @property MonkeyBars
 * @type Object
 */
var MonkeyBars = root.MonkeyBars = {};

// ===================================================================
// === NodeJS Conditional ============================================
// ===================================================================

if(typeof exports !== 'undefined') {
	if(typeof(module) !== 'undefined' && module.exports) {
		exports = module.exports = MonkeyBars;
	}
}

// ===================================================================
// === Helper Methods ================================================
// ===================================================================

/**
 * Creates task based on the options passed.
 *
 * @method createTaskWithOptions
 * @param {Object} options
 * @private
 */
var createTaskWithOptions = function(attributes) {

	// check for attributes
	if(!attributes) {
		if(attributes.logLevel >= LOG_ERROR) {
			console.log(MISSING_ATTRIBUTES);
		}
		return;
	}

	var task;

	// if the attributes passes already has a tid then we know that
	// its an already initialized Task object... else we need to create
	// a task from the attributes passed
	if(attributes.tid) {

		task = attributes;

	} else {

		var type = attributes.type;
		var tasks = attributes.tasks;

		// create any subtasks
		if(tasks) {
			attributes.tasks = createSubTasksFromTaskOptionsArray(tasks);
		}

		if(type) {
			if(type === TYPE_SIMPLE) {
				task = new Task(attributes);
			} else if(type === TYPE_SEQUENCE) {
				task = new SequenceTask(attributes);
			} else if(type === TYPE_PARALLEL) {
				task = new ParallelTask(attributes);
			} else {
				throw UNKNOW_TYPE_WITH_OPTIONS;
			}
		} else {
			if(!tasks) {
				task = new Task(attributes);
			} else {
				task = new SequenceTask(attributes);
			}
		}

	}

	return task;
};

/**
 * Creates an array of tasks based on the options array passed.
 *
 * @method createSubTasksFromTaskOptionsArray
 * @param {Array} tasks
 * @private
 */
var createSubTasksFromTaskOptionsArray = function(tasks) {
	var tempTasks = [];
	if(tasks) {
		for(var i = 0; i < tasks.length; i++) {
			tempTasks.push(createTaskWithOptions(tasks[i]));
		}
	}
	return tempTasks;
};

/**
 * Creates property descriptors from the passes attributes.
 *
 * @method createPropertyDescriptorsWithAttributes
 * @param {Object} attributes
 * @private
 */
var createPropertyDescriptorsWithAttributes = function(attributes) {
	var descriptors = {};
	for(var attribute in attributes) {
		descriptors[attribute] = {
			value: attributes[attribute],
			writable: true
		};
	}
	return descriptors;
};

/**
 * Resets the task to its original non executed state.
 *
 * @method resetTask
 * @param {Task} task
 * @private
 */
var resetTask = function(task) {
	task.state = STATE_INITIALIZED;
	task.processed = false;
	if(task.type !== TYPE_SIMPLE && task.tasks) {
		task.currentIndex = 0;
		task.processedIndex = 0;
		for(var i = 0; i < task.tasks.length; i++) {
			resetTask(task.tasks[i]);
		}
	}
};

/**
 * Generates a unique id for each task.
 *
 * @method generateUniqueId
 * @param {String} prefix
 * @return {String} tid
 * @private
 */
var generateUniqueId = function(prefix) {
	var id = taskIdCounter++;
	var tid = prefix ? prefix + id : TID_PREFIX + id;
	return tid;
};

/**
 * Determains whether the first task is dependent on the second.
 *
 * @method isTaskDependentOnTask
 * @param {Task} task1
 * @param {Task} task2
 * @private
 */
var isTaskDependentOnTask = function(task1, task2) {
	var dependencies = task1.dependencies;
	if(dependencies) {
		var totalDependencies = dependencies.length;
		for(var i = 0; i < totalDependencies; i++) {
			var dependency = dependencies[i];
			if(dependency.tid === task2.tid) {
				return true;
			} else if(dependency === task2.id) {
				return true;
			} else if(dependency === task2.name && task2.name !== "undefined") {
				return true;
			}
		}
	}
	return false;
};

/**
 * Variation of http://blog.stchur.com/2007/04/06/serializing-objects-in-javascript/
 *
 * @method serialize
 * @param {Object} o
 * @return {String} Serialized string representation of the passed object
 * @private
 */
var serialize = function(o) {

	// Let Gecko browsers do this the easy way
	if(typeof o.toSource !== 'undefined' && typeof o.callee === 'undefined') {

		return o.toSource();

	}

	// Other browsers must do it the hard way
	if(typeof o === "number" || typeof o === "boolean" || typeof o === "function") {
		return o;

	} else if(typeof o === "string") {

		return '\'' + o + '\'';

	} else if(typeof o === "object") {

		var str;
		if(o.constructor === Array || typeof o.callee !== 'undefined') {
			str = '[';
			var i, len = o.length;
			for(i = 0; i < len - 1; i++) {
				str += serialize(o[i]) + ',';
			}
			str += serialize(o[i]) + ']';
		} else {
			str = '{';
			var key;
			for(key in o) {
				str += key + ':' + serialize(o[key]) + ',';
			}
			str = str.replace(/\,$/, '') + '}';
		}
		return str;

	} else {

		return 'UNKNOWN';

	}
};

/**
 * Creates a blob string to be used with the web worker for concurrent task execution
 *
 * @method createBlobWithTask
 * @param {Task} task
 * @return {Blob} Blob instance
 * @private
 */
var createBlobWithTask = function(task) {

	// create a console wrapper
	var consoleString = "var console = { log: function(msg) { postMessage({ type: 'console', message: msg }); } };";

	var workerTask;

	if(task.worker !== undefined) {
		if(typeof(task.worker) === "function") {
			workerTask = new task.worker(task);
		} else if(task.worker.constructor !== undefined && typeof(task.worker.constructor) === "function") {
			workerTask = new task.worker.constructor(task);
		}
	} else {
		workerTask = new WorkerTask(task);
	}

	var workerString = "var workerTask = " + serialize(workerTask) + "; workerTask.performTask();";
	var blobString = "onmessage = function(e) {" + consoleString + workerString + "};";

	return new Blob([blobString], {
		type: "text\/javascript"
	});

};

/**
 * Creates a web Worker instance with the passed arguments
 *
 * @method createWebWorkerWithBlobAndTask
 * @param {Blob} blob
 * @param {Task} task
 * @return {Worker} WebWorker instance
 * @private
 */
var createWebWorkerWithBlobAndTask = function(blob, task) {

	// @TODO: Need to figure out what the other browser prefixes for window.URL
	var URL = root.URL || root.webkitURL;

	// create our worker
	var worker = new Worker(URL.createObjectURL(blob));

	// assign worker on message callback
	worker.onmessage = function(e) {
		if(e.data.type === "complete") {
			task.complete(e.data.value);
		} else if(e.data.type === "fault") {
			task.fault(e.data.value);
		} else if(e.data.type === "cancel") {
			task.cancel();
		} else if(e.data.type === "console") {
			console.log(e.data.message);
		} else {
			if(task.worker !== undefined && typeof(task.worker.handler) === "function") {
				task.worker.handler(e);
			} else {
				if(task.logLevel > LOG_ERROR) {
					console.log(UNHANDLED_POST_MESSAGE + ": " + serialize(e.data));
				}
			}
		}
	};

	// assign worker onerror callback
	worker.onerror = function(e) {
		task.fault("WebWorker error.");
	};

	return worker;
};

/**
 * Performs the tasks `performTask` functionality within a web worker
 *
 * @method performTaskFunctionalityWithWebWorker
 * @param {Task} task
 * @private
 */
var performTaskFunctionalityWithWebWorker = function(task) {

	if(typeof(Worker) === "undefined" || typeof(Blob) === "undefined" || task.type !== TYPE_SIMPLE) {
		if(task.logLevel >= LOG_ERROR && task.type === TYPE_SIMPLE) {
			console.log("Cannot perform '" + task.displayName + "' on seperate thread. Web Workers are not supported.");
		}
		task.performTask();
		return;
	}

	if(task.logLevel >= LOG_VERBOSE) {
		console.log("Performing '" + task.displayName + "' Functionality With Web Worker");
	}

	// create our worker
	var worker = createWebWorkerWithBlobAndTask(createBlobWithTask(task), task);

	// start the worker
	worker.postMessage();

};

/**
 * @method decorateTaskBasedOnAttributes
 * @param {Task} task
 * @param {Object} attributes
 * @private
 */
var decorateTaskBasedOnAttributes = function(task, attributes) {
	task.decorators = [];
	if(task.count) {
		forTaskDecorator(task);
	}
	if(task.when) {
		whenTaskDecorator(task);
	}
	if(task.doWhile) {
		whileTaskDecorator(task);
	}
};

/**
 * Extention functionality for various task types.
 *
 * @method extend
 * @for MonkeyBars
 * @param {Object} protoProps
 * @return {Function} child Constructor function for extended task type
 * @example
 *		
 *	var CustomTask = MonkeyBars.Task.extend({
 *		name:"CustomTask",
 *		newMethod:function(){
 *			console.log("Executing newMethod");
 *		}
 *	});
 *	var instance = new CustomTask();
 *
 */
var extend = function(protoProps) {
	var parent = this;
	var child = function() {
			parent.apply(this, arguments);
		};
	var childProto = createPropertyDescriptorsWithAttributes(protoProps);
	child.prototype = Object.create(parent.prototype, childProto);
	return child;
};

// ===================================================================
// === Worker Task ===================================================
// ===================================================================

//%worker

// ===================================================================
// === Simple Task ===================================================
// ===================================================================

//%simple

// ===================================================================
// === Task Group ====================================================
// ===================================================================

//%group

// ===================================================================
// === Parallel Task =================================================
// ===================================================================

//%parallel

// ===================================================================
// === Sequence Task =================================================
// ===================================================================

//%sequence

// ===================================================================
// === Task Decorators ===============================================
// ===================================================================

//%decorators

// ===================================================================
// === Public Interface ==============================================
// ===================================================================

/**
 * Task states contstants.
 *
 * @property TaskStates
 * @for MonkeyBars
 * @type Object
 * @static
 */
MonkeyBars.TaskStates = {
	Initialized: STATE_INITIALIZED,
	Started: STATE_STARTED,
	Canceled: STATE_CANCELED,
	Faulted: STATE_FAULTED,
	Completed: STATE_COMPLETED
};

/**
 * Task types contstants.
 *
 * @property TaskTypes
 * @for MonkeyBars
 * @type Object
 * @static
 */
MonkeyBars.TaskTypes = {
	Parallel: TYPE_PARALLEL,
	Sequence: TYPE_SEQUENCE,
	Simple: TYPE_SIMPLE
};

/**
 * Log level contstants.
 *
 * @property LogLevels
 * @for MonkeyBars
 * @type Object
 * @static
 */
MonkeyBars.LogLevels = {
	None: LOG_NONE,
	Error: LOG_ERROR,
	Info: LOG_INFO,
	Verbose: LOG_VERBOSE
};

/**
 * Task decorators. These are exposed mainly to enable deeper extention.
 *
 * @property TaskDecorators
 * @for MonkeyBars
 * @type Object
 * @static
 */
MonkeyBars.TaskDecorators = {
	For: DECORATOR_FOR,
	When: DECORATOR_WHEN,
	While: DECORATOR_WHILE
};

//%post