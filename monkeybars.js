/*!
 * @module MonkeyBars
 * @main MonkeyBars
 */

(function() {

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

    var TID_PREFIX = "task";
    var TIMEOUT_INTERVAL = 100;
    var OVERRIDE_NEEDED = "Override Needed";
    var UNDEFINED_TASK = "Undefined Task";
    var MISSING_ATTRIBUTES = "No Attributes";
    var UNKNOW_TYPE = "Unknown Task Type";
    var INVALID_ARGUMENTS = "Invalid Arguments";
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
    "count", "interval"];

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

    if (typeof exports !== 'undefined') {
        if (typeof(module) !== 'undefined' && module.exports) {
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
        if (!attributes) {
            if (attributes.logLevel >= LOG_ERROR) {
                console.log(MISSING_ATTRIBUTES);
            }
            return;
        }

        var task;

        // if the attributes passes already has a tid then we know that
        // its an already initialized Task object... else we need to create
        // a task from the attributes passed
        if (attributes.tid) {

            task = attributes;

        } else {

            var type = attributes.type;
            var tasks = attributes.tasks;

            // create any subtasks
            if (tasks) {
                attributes.tasks = createSubTasksFromTaskOptionsArray(tasks);
            }

            if (type) {
                if (type === TYPE_SIMPLE) {
                    task = new Task(attributes);
                } else if (type === TYPE_SEQUENCE) {
                    task = new SequenceTask(attributes);
                } else if (type === TYPE_PARALLEL) {
                    task = new ParallelTask(attributes);
                } else {
                    throw UNKNOW_TYPE;
                }
            } else {
                if (!tasks) {
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
        if (tasks) {
            for (var i = 0; i < tasks.length; i++) {
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
        for (var attribute in attributes) {
            descriptors[attribute] = {
                value: attributes[attribute],
                writable: true
            };
        }
        return descriptors;
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
        if (dependencies) {
            var totalDependencies = dependencies.length;
            for (var i = 0; i < totalDependencies; i++) {
                var dependency = dependencies[i];
                if (dependency.tid === task2.tid) {
                    return true;
                } else if (dependency === task2.id) {
                    return true;
                } else if (dependency === task2.name && task2.name !== "undefined") {
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
        if (typeof o.toSource !== 'undefined' && typeof o.callee === 'undefined') {

            return o.toSource();

        }

        // Other browsers must do it the hard way
        if (typeof o === "number" || typeof o === "boolean" || typeof o === "function") {
            return o;

        } else if (typeof o === "string") {

            return '\'' + o + '\'';

        } else if (typeof o === "object") {

            var str;
            if (o.constructor === Array || typeof o.callee !== 'undefined') {
                str = '[';
                var i, len = o.length;
                for (i = 0; i < len - 1; i++) {
                    str += serialize(o[i]) + ',';
                }
                str += serialize(o[i]) + ']';
            } else {
                str = '{';
                var key;
                for (key in o) {
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

        if (task.worker !== undefined) {
            if (typeof(task.worker) === "function") {
                workerTask = new task.worker(task);
            } else if (task.worker.constructor !== undefined && typeof(task.worker.constructor) === "function") {
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
            if (e.data.type === "complete") {
                task.complete(e.data.value);
            } else if (e.data.type === "fault") {
                task.fault(e.data.value);
            } else if (e.data.type === "cancel") {
                task.cancel();
            } else if (e.data.type === "console") {
                console.log(e.data.message);
            } else {
                if (task.worker !== undefined && typeof(task.worker.handler) === "function") {
                    task.worker.handler(e);
                } else {
                    if (task.logLevel > LOG_ERROR) {
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

        if (typeof(Worker) === "undefined" || typeof(Blob) === "undefined" || task.type !== TYPE_SIMPLE) {
            task.performTask();
            return;
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
        if (task.count) {
            forTaskDecorator(task);
        }
        if (task.when) {
            whenTaskDecorator(task);
        }
        if (task.doWhile) {
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
        if (!task) {
            throw INVALID_ARGUMENTS;
        }
        if (task.data !== undefined) {
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
            if (type !== undefined && typeof(type) === "string") {
                message.type = type;
            }
            if (value !== undefined) {
                message.value = value;
            }
            postMessage(message);
        }
    };

    WorkerTask.extend = extend;

    // ===================================================================
    // === Simple Task ===================================================
    // ===================================================================

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
        for (var attribute in attributes) {
            if (attributes.hasOwnProperty(attribute)) {
                var option = true;
                for (var i = 0; i < taskOptions.length; i++) {
                    // @TODO: Need to add functionality here to make sure that the options passed
                    // match up to their type
                    if (attribute === taskOptions[i] || typeof(attributes[attribute]) === "function") {
                        option = false;
                        break;
                    }
                }
                if (option) {
                    if (task.options === undefined) {
                        task.options = {};
                    }
                    task.options[attribute] = attributes[attribute];
                } else {
                    if (!task.hasOwnProperty(attribute)) {
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

    Task.prototype = Object.create({}, {

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
                if (this.state > STATE_STARTED) {
                    return;
                }
                this.state = STATE_CANCELED;
                if (this.logLevel >= LOG_INFO) {
                    console.log("Canceled:" + this.displayName);
                }
                if (this.timeoutId) {
                    clearTimeout(this.timeoutId);
                }
                this.onChange(this.state);
                this.onCancel();
            },
            writable: true
        },

        /**
         * Calling this method says that the tasks execution is now complete.
         *
         * @for Task
         * @method complete
         * @example
         *
         *	var task = new MonkeyBars.Task({
         *		performTask:function(){
         *			this.complete();
         *		}
         *	});
         *
         *	task.start();
         *
         */
        complete: {
            value: function(data) {
                if (this.state > STATE_STARTED) {
                    return;
                }
                this.state = STATE_COMPLETED;
                if (this.logLevel >= LOG_INFO) {
                    console.log("Completed:" + this.displayName);
                }
                if (this.timeoutId) {
                    clearTimeout(this.timeoutId);
                }
                this.executionTime = (new Date().getTime()) - this.startTime;

                if (arguments.length > 0) {
                    this.handleData(data);
                }
                this.onComplete(data);
                this.onChange(this.state, data);
            },
            writable: true
        },

        /**
         * Whether or not to run the task concurrently through Web Workers
         *
         * @for Task
         * @property concurrent
         * @type Boolean
         * @default false
         */
        concurrent: {
            value: false,
            writable: true
        },

        /**
         * Task data
         *
         * @for Task
         * @property data
         * @type Object
         * @default undefined
         */
        data: {
            value: undefined,
            writable: true
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
                if (this.name) {
                    return this.name;
                } else {
                    return this.type;
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
                if (this.state >= STATE_CANCELED) {
                    return;
                }
                this.state = STATE_FAULTED;
                if (this.logLevel >= LOG_INFO) {
                    console.log("Faulted:" + this.displayName);
                }
                if (this.timeoutId) {
                    clearTimeout(this.timeoutId);
                }
                this.onChange(this.state, undefined, error);
                this.onFault(error);
            },
            writable: true
        },

        /**
         * Callback for handling data manipulated by a taskj. Overwrite this method
         * to do something other than setting data to what is passed.
         *
         * @for TaskGroup
         * @method handleData
         */
        handleData: {
            value: function(data) {
                if (arguments.length < 0) {
                    return;
                }
                this.data = data;
            },
            writable: true
        },

        /**
         * Initialization functionality
         *
         * @for Task
         * @method initialize
         * @param {Object} attributes
         */
        initialize: {
            value: function(attributes) {},
            writable: true
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
         * Convenience method called when the task is canceled.
         *
         * @for Task
         * @method onCancel
         */
        onCancel: {
            value: function() {},
            writable: true
        },

        /**
         * This method is called during the execution lifecycle of the task. It is intentionally
         * left blank and is up to the instance to describe it functionality.
         *
         * @for Task
         * @method onChange
         * @param {Integer} state The current state of the task
         * @param {String} error Message describing error
         * @example
         *
         *	var task = new MonkeyBars.Task({
         *		performTask:function(){
         *			this.complete();
         *		},
         *		onChange:function(state,error){
         *			if(state == MonkeyBars.TaskStates.Completed){
         *				alert("complete");
         *			}
         *		}
         *	});
         *
         *	task.start();
         *
         */
        onChange: {
            value: function(state, data, error) {},
            writable: true
        },

        /**
         * Convenience method called when the task completes.
         *
         * @for Task
         * @method onComplete
         */
        onComplete: {
            value: function(data) {},
            writable: true
        },

        /**
         * Convenience method called when the task faults.
         *
         * @for Task
         * @method onFault
         * @param {String} error Message describing error
         */
        onFault: {
            value: function(error) {},
            writable: true
        },

        /**
         * Convenience method called when the task starts.
         *
         * @for Task
         * @method onStart
         */
        onStart: {
            value: function() {},
            writable: true
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
            },
            writable: true
        },

        /**
         * Resets a task to its original state
         *
         * @for Task
         * @method reset
         */
        reset: {
            value: function() {
                this.state = STATE_INITIALIZED;
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
                if (this.state >= STATE_STARTED) {
                    return;
                }

                this.startTime = new Date().getTime();
                this.state = STATE_STARTED;
                if (this.logLevel >= LOG_INFO) {
                    console.log("Started:" + this.displayName);
                }
                if (this.timeout !== undefined) {
                    var delegate = this;
                    this.timeoutId = setTimeout(function() {
                        delegate.fault();
                    }, this.timeout);
                }
                this.onChange(this.state);
                if (this.concurrent) {
                    performTaskFunctionalityWithWebWorker(this);
                } else {
                    this.performTask();
                }

                this.onStart();
            },
            writable: true
        },

        /**
         * The current state of the task
         *
         * @for Task
         * @property state
         * @type Integer
         * @readonly
         * @default 0
         */
        state: {
            value: STATE_INITIALIZED,
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
            value: TYPE_SIMPLE,
            writable: true
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
            value: undefined,
            writable: true
        }
    });

    Task.extend = extend;

    // ===================================================================
    // === Task Group ====================================================
    // ===================================================================

    /**
     * A task group, and extention of task, provides the building blocks for creating
     * a group of tasks that is inherently a task itself.
     *
     * @extends Task
     * @constructor
     * @class TaskGroup
     * @param {Object} attributes List of attributes to apply to the task group
     */
    var TaskGroup = MonkeyBars.TaskGroup = function(attributes) {
        var task = this;

        if (attributes) {
            task.tasks = createSubTasksFromTaskOptionsArray(attributes.tasks);
        }

        // create dependency map and populate it with subtask tids
        task.dependencyMap = {};
        if (task.tasks) {
            for (var i = 0; i < task.tasks.length; i++) {
                var subtask = task.tasks[i];
                this.dependencyMap[subtask.tid] = [];
                task.setDependeciesForTask(subtask);
            }
        }

        // super
        Task.call(task, attributes);
    };

    TaskGroup.prototype = Object.create(Task.prototype, {

        /**
         * Adds a subtask to the groups queue. This is helpful when you want to add
         * a sub task after instantiation.
         *
         * @for TaskGroup
         * @method addSubTask
         * @param {Object} task Either an object containing attributes of a task or
         * an already instantiated task
         * @example
         *
         *	var parallel = new MonkeyBars.ParallelTask();
         *	
         *	parallel.addSubTask({
         *		name:"subtask",
         *		performTask:function(){
         *			this.complete();
         *		}
         *	});
         *
         *	var simple = new MonkeyBars.simple({
         *		name:"subtask",
         *		performTask:function(){
         *			this.complete();
         *		}
         *	});
         *
         *	parallel.addSubTask(simple);
         *
         */
        addSubTask: {
            value: function(task) {
                if (!task) {
                    throw "addSubTask: " + INVALID_ARGUMENTS;
                }
                if (!task.tid) {
                    task = createTaskWithOptions(task);
                }
                this.setDependeciesForTask(task);
                this.tasks.push(task);
            },
            writable: true
        },

        /**
         * Adds a subtask after another task
         *
         * @for TaskGroup
         * @method addSubTaskAfterTask
         * @param {Object} task Either an object containing attributes of a task or
         * @param {Object} afterTask Reference to an already added task
         * @example
         *
         *	var parallel = new MonkeyBars.ParallelTask({
         *		tasks:[task1,task3]
         *	});
         *
         *	var task2 = new MonkeyBars.Task();
         *	parallel.addTaskAfterTask(task2,task1);
         *
         */
        addSubTaskAfterTask: {
            value: function(task, afterTask) {
                if (!task || !afterTask) {
                    throw "addSubTaskAfterTask: " + INVALID_ARGUMENTS;
                }
                if (!task || this.state === STATE_CANCELED) {
                    return;
                }
                if (!task.tid) {
                    task = createTaskWithOptions(task);
                }
                this.setDependeciesForTask(task);
                var index = this.tasks.indexOf(afterTask);
                this.tasks.splice(index + 1, 0, task);
            },
            writable: true
        },

        /**
         * Very similar to `addSubTaskAfterTask` except the inject task appears
         * before the second arguments position.
         *
         * @for TaskGroup
         * @method addSubTaskBeforeTask
         * @param {Object} task Either an object containing attributes of a task or
         * @param {Object} beforeTask Reference to an already added task
         */
        addSubTaskBeforeTask: {
            value: function(task, beforeTask) {
                if (!task || !beforeTask) {
                    throw "addSubTaskBeforeTask: " + INVALID_ARGUMENTS;
                }
                if (!task || this.state === STATE_CANCELED) {
                    return;
                }
                if (!task.tid) {
                    task = createTaskWithOptions(task);
                }
                this.setDependeciesForTask(task);
                var index = this.tasks.indexOf(beforeTask);
                this.tasks.splice(index, 0, task);
            },
            writable: true
        },

        /**
         * Cancel the group and cancel all of its subtasks
         *
         * @for TaskGroup
         * @method cancel
         */
        cancel: {
            value: function() {

                // call cancel on this task
                Task.prototype.cancel.call(this);

                // cancel all of this tasks subtasks
                for (var i = 0; i < this.tasks.length; i++) {
                    // we only want to cancel those tasks that are currently running
                    // otherwise we want to set the canceled flag
                    var task = this.tasks[i];
                    if (task.state > STATE_INITIALIZED) {
                        task.cancel();
                    } else {
                        task.state = STATE_CANCELED;
                    }
                }
            },
            writable: true
        },

        /**
         * The index of the subtasks that have completed execution.
         *
         * @for Task
         * @property currentIndex
         * @type Integer
         * @readonly
         * @default 0
         */
        currentIndex: {
            value: 0,
            writable: true
        },

        /**
         * Return a Task object, if it exists, based on the `name` passed.
         *
         * @for TaskGroup
         * @method getTaskByName
         * @param {String} name The user defined name
         */
        getTaskByName: {
            value: function(name) {
                for (var i = 0; i < this.tasks.length; i++) {
                    var task = this.tasks[i];
                    if (task.name === name) {
                        return task;
                    }
                }
            },
            writable: true
        },

        /**
         * Return a Task object, if it exists, based on the `tid` passed.
         *
         * @for TaskGroup
         * @method getTaskByTid
         * @param {String} tid The id of the task you want
         * @example
         *
         *	var parallel = new MonkeyBars.ParallelTask({
         *		tasks:[task1,task3]
         *	});
         *
         *	parallel.getTaskByTid(task1.tid);
         *
         */
        getTaskByTid: {
            value: function(tid) {
                for (var i = 0; i < this.tasks.length; i++) {
                    var task = this.tasks[i];
                    if (task.tid === tid) {
                        return task;
                    }
                }
            },
            writable: true
        },

        /**
         * Called when a subtask calls its cancel method. When a subtask is canceled
         * any other subtasks that are dependent on the canceled task are cancled.
         *
         * @for TaskGroup
         * @method onSubTaskCancel
         * @param {Task} task The task that was just canceled
         */
        onSubTaskCancel: {
            value: function(task) {
                for (var i = 0; i < this.tasks.length; i++) {
                    if (isTaskDependentOnTask(this.tasks[i], task)) {
                        this.tasks[i].state = STATE_CANCELED;
                    }
                }
            },
            writable: true
        },

        /**
         * Called when a sub task completes. Must be overridden with functionality
         * provided by the extending class.
         *
         * @for TaskGroup
         * @method onSubTaskComplete
         * @param {Task} task The task that just completed
         * @param {Object} data
         */
        onSubTaskComplete: {
            value: function(task, data) {
                if (data !== undefined) {
                    this.handleData(data);
                }
            },
            writable: true
        },

        /**
         * Called when a subtask calls its fault method.
         *
         * @for TaskGroup
         * @method onSubTaskFault
         * @param {String} error Error message.
         * @param {Task} task The task that just completed
         */
        onSubTaskFault: {
            value: function(task, error) {
                this.fault(error);
            },
            writable: true
        },

        /**
         * An incrimented number of the tasks that have already been processed.
         *
         * @for ParallelTask
         * @property processedIndex
         * @type Integer
         */
        processedIndex: {
            value: 0,
            writable: true
        },

        /**
         * Processes a sub task and prepares it for execution. This method overwrites the
         * tasks on change functionality. If you wish to have a sub task that handles
         * its own change functionality then you will need to implement the partner
         * convenience methods.
         *
         * @for TaskGroup
         * @method processSubTask
         * @param {Task} task Subtask to process
         */
        processSubTask: {
            value: function(task) {

                if (!task) {
                    if (this.logLevel >= LOG_ERROR) {
                        console.log(UNDEFINED_TASK);
                    }
                    return;
                }

                if (task.state === STATE_CANCELED) {
                    this.onSubTaskCancel(task);
                    return true;
                }

                this.processedIndex++;

                task.group = this;
                task.data = this.data;
                task.concurrent = this.concurrent;
                task.processed = true;
                task.logLevel = this.logLevel;

                // set execution block
                task.onChange = function(state, data, error) {
                    if (state === STATE_COMPLETED) {
                        this.group.onSubTaskComplete(this, data);
                    } else if (state === STATE_FAULTED) {
                        this.group.onSubTaskFault(this, undefined, error);
                    } else if (state === STATE_CANCELED) {
                        this.group.onSubTaskCancel(this);
                    }
                };

                task.start();

                return false;
            },
            writable: true
        },

        /**
         * Removes a task from its group. Removing the task after it has executed will
         * have no apparent affect as it has already ran.
         *
         * @for TaskGroup
         * @method removeSubTask
         * @param {Task} task The task you wish to remove from the group.
         */
        removeSubTask: {
            value: function(task) {
                if (!task) {
                    return;
                }
                var index = this.tasks.indexOf(task);
                this.tasks.splice(index, 1);
            },
            writable: true
        },

        /**
         * Resets a task to its original state
         *
         * @for Task
         * @method reset
         */
        reset: {
            value: function() {
                if (this.tasks) {
                    this.currentIndex = 0;
                    this.processedIndex = 0;
                    for (var i = 0; i < this.tasks.length; i++) {
                        this.tasks[i].reset();
                    }
                }
                Task.prototype.reset.call(this);
            }
        },

        /**
         * Sets dependencies for the passed task.
         *
         * @method setDependeciesForTask
         * @param {Task} task
         * @static
         */
        setDependeciesForTask: {
            value: function(task) {
                if (task.dependencies) {
                    var totalDependencies = task.dependencies.length;
                    for (var i = 0; i < totalDependencies; i++) {
                        var dependency = task.dependencies[i];
                        if (dependency.tid) {
                            this.dependencyMap[task.tid].push(dependency.tid);
                        } else {
                            this.dependencyMap[task.tid].push(dependency);
                        }
                    }

                }
            },
            writable: false
        }
    });

    TaskGroup.extend = extend;

    // ===================================================================
    // === Parallel Task =================================================
    // ===================================================================

    /**
     * A ParallelTask is a TaskGroup that runs all of its subtasks ansynchronously. Its
     * complete functionality is run when all of its sub tasks are complete.
     *
     * @extends TaskGroup
     * @constructor
     * @class ParallelTask
     * @param {Object} attributes List of attributes to apply to the task group
     * @example
     *
     *		var parallel = new MonkeyBars.ParallelTask({
     *			name:"ParallelTask",
     *			tasks:[new MonkeyBars.Task({
     *				performTask:function(){
     *					this.complete();
     *				}
     *			})],
     *			onComplete:function(){
     *				alert(this.name + " is complete!");
     *			}
     *		});
     *
     *		parallel.start();
     *
     */
    var ParallelTask = MonkeyBars.ParallelTask = function(attributes) {
        var task = this;
        TaskGroup.call(task, attributes);
    };

    ParallelTask.prototype = Object.create(TaskGroup.prototype, {

        /**
         * This method is overridden from `TaskGroups` implementation because of the
         * nature of a parallel task. When a task is added it should be immediately
         * processed and started.
         *
         * @for ParallelTask
         * @method addSubTask
         * @param {Object} task Either an object containing attributes of a task or
         */
        addSubTask: {
            value: function(task) {
                if (!task || task.state === STATE_CANCELED) {
                    return;
                }
                this.currentIndex++;
                if (!task.tid) {
                    task = createTaskWithOptions(task);
                }
                this.tasks.push(task);
                this.processSubTask(task);
            },
            writable: true
        },

        /**
         * Checks whether or not the group has any enabled sub tasks.
         *
         * @for ParallelTask
         * @method hasNoEnabledSubTasks
         * @return {Boolean} Has sub tasks or not
         */
        hasNoEnabledSubTasks: {
            value: function() {
                if (!this.tasks) {
                    return true;
                }
                for (var i = 0; i < this.tasks.length; i++) {
                    var task = this.tasks[i];
                    if (task.state !== STATE_CANCELED) {
                        return false;
                    }
                }
                return true;
            },
            writable: true
        },

        /**
         * The max amounts of tasks that can run simultaneously
         *
         * @for ParallelTask
         * @property max
         * @type Integer
         */
        max: {
            value: 0,
            writable: true
        },

        /**
         * Overridden from TaskGroup. This method is run everytime a sub task
         * completes. When all subtasks are complete the groups complete method
         * is called.
         *
         * @for ParallelTask
         * @method onSubTaskComplete
         * @param {Task} task
         * @param {Object} data
         */
        onSubTaskComplete: {
            value: function(task, data) {
                this.currentIndex++;
                if (this.currentIndex === this.tasks.length) {


                    ///*
                    if (this.group !== undefined) {
                        this.complete(this.data);
                    } else {
                        this.complete();
                    }
                    //*/
                    // this.complete(this.data);


                } else {
                    TaskGroup.prototype.onSubTaskComplete.call(this, task, data);
                    this.processSubTasks();
                }
            },
            writable: true
        },

        /**
         * Overridden from Task. First checks to see if there are any enabled
         * subtasks to process. If there arent the groups complete method is called.
         * If there are then the group processes all of the sub tasks it has.
         *
         * @for ParallelTask
         * @method performTask
         */
        performTask: {
            value: function() {
                if (this.hasNoEnabledSubTasks()) {
                    this.complete();
                } else {
                    this.processSubTasks();
                }
            },
            writable: true
        },

        /**
         * Overridden from TaskGroup. Processes a sub task and prepares it for execution. This method overwrites the
         * tasks on change functionality. If you wish to have a sub task that handles
         * its own change functionality then you will need to implement the partner
         * convenience methods.
         *
         * @for ParallelTask
         * @method processSubTask
         * @param {Task} task Subtask to process
         */
        processSubTask: {
            value: function(task) {
                if (task !== undefined && task.dependencies !== undefined) {
                    var totalDependencies = task.dependencies.length;
                    var canProcess = totalDependencies;
                    var processCount = 0;
                    var dependencyNames = [];
                    for (var i = 0; i < totalDependencies; i++) {
                        var dependency = task.dependencies[i];
                        dependencyNames.push(dependency.displayName);
                        if (dependency.state > STATE_STARTED) {
                            processCount++;
                        }
                    }
                    if (processCount < canProcess) {
                        if (this.logLevel >= LOG_VERBOSE) {
                            console.log("Cannot process " + task.displayName + " until its dependencies [" + dependencyNames.join(",") + "] have run");
                        }
                        return;
                    }
                }
                TaskGroup.prototype.processSubTask.call(this, task);
            },
            writable: true
        },

        /**
         * Processes all of the sub tasks available for the group
         *
         * @for ParallelTask
         * @method processSubTasks
         */
        processSubTasks: {
            value: function() {
                var processTotal = this.max === 0 ? this.tasks.length : this.max;
                for (var i = 0; i < processTotal; i++) {
                    var task = this.tasks[i];
                    if (!task.processed) {
                        this.processSubTask(task);
                    }
                }
            },
            writable: true
        },

        /**
         * The kind of task
         *
         * @for ParallelTask
         * @property type
         * @type String
         * @readonly
         */
        type: {
            value: TYPE_PARALLEL,
            writable: true
        }
    });

    ParallelTask.extend = extend;

    // ===================================================================
    // === Sequence Task =================================================
    // ===================================================================

    /**
     * A SequenceTask is a TaskGroup that runs all of its subtasks serially. Its
     * complete functionality is run when all of its sub tasks are complete.
     *
     * @extends TaskGroup
     * @constructor
     * @class SequenceTask
     * @param {Object} attributes List of attributes to apply to the task group
     * @example
     *
     *		var sequence = new MonkeyBars.SequenceTask({
     *			name:"ParallelTask",
     *			tasks:[new MonkeyBars.Task({
     *				performTask:function(){
     *					this.complete();
     *				}
     *			})],
     *			onComplete:function(){
     *				alert(this.name + " is complete!");
     *			}
     *		});
     *
     *		sequence.start();
     *
     */
    var SequenceTask = MonkeyBars.SequenceTask = function(attributes) {
        var task = this;
        TaskGroup.call(task, attributes);
    };

    SequenceTask.prototype = Object.create(TaskGroup.prototype, {

        /**
         * Overriden from TaskGroup. As long as the group has not been canceled,
         * when a sub task is canceled it simply moves on to the next task in the queue.
         *
         * @for SequenceTask
         * @method onSubTaskCancel
         * @param {Task} task
         */
        onSubTaskCancel: {
            value: function(task) {
                TaskGroup.prototype.onSubTaskCancel.call(this, task);
                if (this.state !== STATE_CANCELED) {
                    this.startNextSubTask();
                }
            },
            writable: true
        },

        /**
         * Overridden from TaskGroup. As long as the group has not been canceled,
         * when a sub task completes it starts the next sibling in the queue.
         *
         * @for SequenceTask
         * @method onSubTaskComplete
         * @param {Task} task
         * @param {Object} data
         */
        onSubTaskComplete: {
            value: function(task, data) {
                if (this.state === STATE_CANCELED) {
                    return;
                }
                TaskGroup.prototype.onSubTaskComplete.call(this, task, data);
                this.startNextSubTask();
            },
            writable: true
        },

        /**
         * Starts the next sub task in the sequence. If overriden you need to call the
         * SequenceTask's prototype `performTask` method.
         *
         * @for SequenceTask
         * @method performTask
         * @param {Task} task
         */
        performTask: {
            value: function() {
                this.startNextSubTask();
            },
            writable: true
        },

        /**
         * Starts the next task in the queue after its previous sibling has completed.
         *
         * @for SequenceTask
         * @method startNextSubTask
         */
        startNextSubTask: {
            value: function() {
                if (this.state >= STATE_CANCELED) {
                    return;
                }
                if (this.tasks && this.currentIndex < this.tasks.length) {
                    var task = this.tasks[this.currentIndex++];
                    var skipped = this.processSubTask(task);
                    if (skipped) {
                        if (this.logLevel >= LOG_INFO) {
                            console.log("Skipped: " + task.displayName + " Group: " + this.displayName);
                        }
                        this.startNextSubTask();
                    }
                } else {


                    ///*
                    if (this.group !== undefined) {
                        this.complete(this.data);
                    } else {
                        this.complete();
                    }
                    //*/
                    // this.complete(this.data);


                }
            },
            writable: true
        },

        /**
         * The kind of task
         *
         * @for SequenceTask
         * @property type
         * @type String
         * @readonly
         */
        type: {
            value: TYPE_SEQUENCE,
            writable: true
        }
    });

    SequenceTask.extend = extend;

    // ===================================================================
    // === Task Decorators ===============================================
    // ===================================================================

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
            if (this.itterationIndex !== this.count - 1) {
                this.reset();
                this.itterationIndex++;
                if (this.logLevel >= LOG_INFO) {
                    console.log("Completed:" + this.displayName + " " + this.itterationIndex + " out of " + this.count + " times");
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
            if (this.doWhile()) {
                this.state = STATE_INITIALIZED;
                var delegate = this;
                if (this.interval !== 0) {
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
                if (delegate.when()) {
                    Task.prototype.start.call(delegate);
                    clearInterval(this);
                }
            }, this.interval);
        };
    };

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

}).call(this);