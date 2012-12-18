/*!
 * MonkeyBars 
 * Simple library that provides a simple structure for handling singular, sequential 
 * and parallel units of code. 
 * https://github.com/mcgaryes/monkeybars
 * 
 * @version 0.0.1 
 * @author Eric McGary
 * @module MonkeyBars
 * @main MonkeyBars
 */
(function() {

	// ===================================================================
	// === Constants =====================================================
	// ===================================================================

	var STATE_INITIALIZED	=	0;
	var STATE_STARTED		=	1;
	var STATE_CANCELED		=	2;
	var STATE_FAULTED		=	3;
	var STATE_COMPLETED		=	4;

	var TYPE_PARALLEL		=	"parallel";
	var TYPE_SEQUENCE		=	"sequence";
	var TYPE_SIMPLE			=	"simple";

	var DECORATOR_FOR		=	"for";
	var DECORATOR_WHEN		=	"when";
	var DECORATOR_WHILE		=	"while";

	var TID_PREFIX			=	"tid";
	var TIMEOUT_INTERVAL	=	100;
	var OVERRIDE_NEEDED		=	"This method must be overridden.";

	// ===================================================================
	// === Private Variables =============================================
	// ===================================================================

	var root = this;
	var taskIdCounter = 0;
	var MonkeyBars = {};

	// ===================================================================
	// === NodeJS Conditional ============================================
	// ===================================================================

	if(typeof exports !== 'undefined') {
		if(typeof module !== 'undefined' && module.exports) {
			exports = module.exports = MonkeyBars;
		}
	}

	// ===================================================================
	// === Helper Functions ==============================================
	// ===================================================================

	/**
	 * Creates task based on the options passed
	 *
	 * @method createTaskWithOptions
	 * @param {Object} options
	 * @private
	 */
	var createTaskWithOptions = function(attributes){

		// check for attributes
		if(!attributes) {
			throw "No attributes passed";
			return;
		}

		if(attributes.tid) return attributes;

		var task;
		var type = attributes.type;
		var tasks = attributes.tasks;

		// create any subtasks
		if (tasks) attributes.tasks = createSubTasksFromTaskOptionsArray(tasks);

		if(type) {
			if(type == TYPE_SIMPLE) {
				task = new Task(attributes);
			} else if(type == TYPE_SEQUENCE) {
				task = new SequenceTask(attributes);
			} else if(type == TYPE_PARALLEL){
				task = new ParallelTask(attributes);
			}
		} else {
			if (!tasks) {
				task = new Task(attributes);
			} else {
				task = new SequenceTask(attributes);
			}
		}
		
		return task;
	}

	/**
	 * Creates an array of tasks based on the options array passed
	 *
	 * @method createSubTasksFromTaskOptionsArray
	 * @param {Array} tasks
	 * @private
	 */
	var createSubTasksFromTaskOptionsArray = function(tasks){
		var tempTasks = [];
		if(tasks) {
			for(var i=0;i<tasks.length;i++){
				tempTasks.push(createTaskWithOptions(tasks[i]));
			}
		}
		return tempTasks;
	}

	/**
	 * Creates property descriptors from the passes attributes
	 *
	 * @method createPropertyDescriptorsWithAttributes
	 * @param {Object} attributes
	 * @private
	 */
	var createPropertyDescriptorsWithAttributes = function(attributes){
		var descriptors = {};
		for (var attribute in attributes) {
			// @TODO: If the attribute in question already has property descriptors then carry those over
			descriptors[attribute] = { 
				value: attributes[attribute],
				writable:true,
				configurable:true,
				enumerable:true
			};
		}
		return descriptors;
	}

	/** 
	 * Resets the task to its original non executed state
	 *
	 * @method resetTask
	 * @param {Object} task
	 * @private
	 */
	var resetTask = function(task){
		task.state = STATE_INITIALIZED;
		if(task.type != TYPE_SIMPLE && task.tasks){
			task.currentIndex = 0;
			for (var i = 0; i < task.tasks.length; i++) {
				resetTask(task.tasks[i]);
			};
		}
	}

	/**
	 * Generates a unique id for each task
	 *
	 * @method generateUniqueId
	 * @param {String} prefix
	 * @return {String} tid
	 * @private
	 */
	var generateUniqueId = function(prefix){
  		var id = '' + taskIdCounter++;
    	return prefix ? prefix + id : TID_PREFIX + id;
	}

	/**
	 * Extention functionality for various task types.
	 * @method extend
	 * @param {Object} protoProps
	 * @return {Function} child Constructor function for extended task type
	 * @example
			
			var CustomTask = MonkeyBars.Task.extend({
				name:"CustomTask",
				newMethod:function(){
					console.log("Executing newMethod");
				}
			});

			var instance = new CustomTask();

	 */
	var extend = function(protoProps) {
		var parent = this;
		var child = function(){ parent.apply(this, arguments); };
		var childProto = createPropertyDescriptorsWithAttributes(protoProps);
		child.prototype = Object.create(parent.prototype,childProto);
		return child;
	}

	// ===================================================================
	// === Tasks Objects =================================================
	// ===================================================================

	// @TODO: Figure out what properties should be 'writable'... I am
	// thinking all of them should to allow future extention by the end
	// developer, but investigate.

	/**
	 * The simplest form of a __MonkeyBars__ task. Once started the task executes all 
	 * functionality located within the `performTask` function block. Set `loggingEnabled`
	 * to see console logs during task execution.
	 * 
	 * @extends Object
	 * @constructor
	 * @class Task
	 * @param {Object} attributes List of attributes to apply to the task
	 * @example
			
			var task = new MonkeyBars.Task({
				name:"ExampleTask",
				performTask:function(){
					this.complete();
				},
				onComplete:function(){
					alert(this.name + " is complete!");
				}
    		});

    		task.start();

	 */
	 var Task = MonkeyBars.Task = function(attributes) {
	 
	 	// refernce for readability
	 	var task = this;
	 	task.tid = generateUniqueId();

	 	// add our attributes
	 	for (var prop in attributes) {
			if (!task.hasOwnProperty(prop)) {
				task[prop] = attributes[prop];
			}
		}

	 	// decorate out task
	 	task.decorators = [];
		if(task.count) ForTaskDecorator(task);
		if(task.when) WhenTaskDecorator(task);
		if(task.while) WhileTaskDecorator(task);

	 }

	Task.prototype = Object.create({}, {
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
		name: {
			value: TYPE_SIMPLE,
			writable: true
		},
		state: {
			value: STATE_INITIALIZED,
			writable: true
		},
		cancel: {
			value: function() {
				if(this.state > STATE_STARTED) return;
				this.state = STATE_CANCELED;
				if(this.loggingEnabled) console.log("Canceled:" + this.name);
				this.onChange(this.state);
				this.onCancel();
			},
			writable: true
		},
		complete: {
			value: function() {
				if(this.state > STATE_STARTED) return;
				this.state = STATE_COMPLETED;
				if(this.loggingEnabled) console.log("Completed:" + this.name);
				this.executionTime = (new Date().getTime()) - this.startTime;
				this.onComplete();
				this.onChange(this.state);
			},
			writable: true
		},
		fault: {
			value: function(error) {
				if(this.state >= STATE_CANCELED) return;
				this.state = STATE_FAULTED;
				if(this.loggingEnabled) console.log("Faulted:" + this.name);
				this.onChange(this.state, error);
				this.onFault(error);
			},
			writable: true
		},
		onChange: {
			value: function(state, error) {},
			writable: true
		},
		onStart: {
			value: function() {},
			writable: true
		},
		onFault: {
			value: function(error) {},
			writable: true
		},
		onComplete: {
			value: function() {},
			writable: true
		},
		onCancel: {
			value: function() {},
			writable: true
		},
		performTask: {
			value: function() { throw OVERRIDE_NEEDED; },
			writable: true
		},
		start: {
			value:function() {
				if(this.state >= STATE_STARTED) return;
				this.startTime = new Date().getTime();
				this.state = STATE_STARTED;
				if(this.loggingEnabled) console.log("Started:" + this.name);
				this.onChange(this.state);
				this.performTask();
				this.onStart();
			},
			writable: true
		}
	});
	
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
	 	// refernce for readability
	 	var task = this;

	 	// custom functionality
	 	if(attributes) task.tasks = createSubTasksFromTaskOptionsArray(attributes.tasks);

	 	// super
	 	Task.call(task,attributes);
	 }

	TaskGroup.prototype = Object.create(Task.prototype, {
		currentIndex: {
			value: 0,
			writable: true
		},
		addSubTask: {
			value: function(task) {
				if(!task.id) task = createTaskWithOptions(task);
				this.tasks.push(task);
			},
			writable: true
		},
		addSubTaskAfterTask: {
			value: function(task, afterTask) {
				if(!task || this.state == STATE_CANCELED) return;
				if(!task.id) task = createTaskWithOptions(task);
				var index = this.tasks.indexOf(afterTask);
				this.tasks.splice(index, 0, task);
			},
			writable: true
		},
		onSubTaskComplete: {
			value: function() {
				throw "This is an abstract method and must be implemented in a subclass.";
			},
			writable: true
		},
		onSubTaskFault: {
			value: function(error) {
				this.fault(error);
			},
			writable: true
		},
		onSubTaskCancel: {
			value: function(task) {
				this.cancel();
			},
			writable: true
		},
		processSubTask: {
			value: function(task) {

				if(!task) throw "You cannot process a task with a nil value.";

				if(task.state == STATE_CANCELED) {
					this.onSubTaskCancel(task);
					return true;
				}

				task.group = this;
				task.loggingEnabled = this.loggingEnabled;

				// set execution block
				task.onChange = function(state, error) {
					if(state == STATE_COMPLETED) this.group.onSubTaskComplete();
					else if(state == STATE_FAULTED) this.group.onSubTaskFault(error);
					else if(state == STATE_CANCELED) this.group.onSubTaskCancel(task);
				}

				task.start();

				return false;
			},
			writable: true
		},
		removeSubTask: {
			value: function(task) {
				if(!task) return;
				var index = this.tasks.indexOf(task);
				this.tasks.splice(index, 1);
			},
			writable: true
		},
		getTaskById: {
			value: function(tid) {
				for(var i = 0; i < this.tasks.length; i++) {
					var task = this.tasks[i];
					if(task.tid == tid) return task;
				};
			},
			writable: true
		}
	});

	/**
	 * A ParallelTask is a TaskGroup that runs all of its subtasks ansynchronously. Its
	 * complete functionality is run when all of its sub tasks are complete.
	 * 
	 * @extends TaskGroup
	 * @constructor
	 * @class ParallelTask
	 * @param {Object} attributes List of attributes to apply to the task group
	 * @example

			var parallel = new MonkeyBars.ParallelTask({
				name:"ParallelTask",
				tasks:[new MonkeyBars.Task({
					performTask:function(){
						this.complete();
					}
				})],
				onComplete:function(){
					alert(this.name + " is complete!");
				}
			});

			parallel.start();

	 */
	 var ParallelTask = MonkeyBars.ParallelTask = function(attributes) {
	 	// refernce for readability
	 	var task = this;

	 	// super
	 	TaskGroup.call(task,attributes);
	 }

	ParallelTask.prototype = Object.create(TaskGroup.prototype, {
		type: {
			value: TYPE_PARALLEL,
			writable: true
		},
		name: {
			value: TYPE_PARALLEL,
			writable: true
		},
		hasNoEnabledSubTasks: {
			value: function() {
				if(!this.tasks) return true;
				for(var i = 0; i < this.tasks.length; i++) {
					var task = this.tasks[i];
					if(task.state != STATE_CANCELED) return false;
				}
				return true;
			},
			writable: true
		},
		processSubTasks: {
			value: function() {
				for(var i = 0; i < this.tasks.length; i++) {
					var task = this.tasks[i];
					this.currentIndex++;
					this.processSubTask(task);
				}
			},
			writable: true
		},
		addSubTask: {
			value: function(task) {
				if(!task || task.state == STATE_CANCELED) return;
				this.currentIndex++;
				if(!task.id) task = new Task(task);
				this.tasks.push(task);
				this.processSubTask(task);
			},
			writable: true
		},
		onSubTaskComplete: {
			value: function() {
				this.currentIndex = this.currentIndex++;
				if(this.currentIndex == this.tasks.length) {
					this.complete();
				}
			},
			writable: true
		},
		performTask: {
			value: function() {
				if(this.hasNoEnabledSubTasks()) {
					this.complete();
				} else {
					this.processSubTasks();
				}
			},
			writable: true
		}
	});

	/**
	 * A SequenceTask is a TaskGroup that runs all of its subtasks serially. Its
	 * complete functionality is run when all of its sub tasks are complete.
	 * 
	 * @extends TaskGroup
	 * @constructor
	 * @class SequenceTask
	 * @param {Object} attributes List of attributes to apply to the task group
	 * @example

			var sequence = new MonkeyBars.SequenceTask({
				name:"ParallelTask",
				tasks:[new MonkeyBars.Task({
					performTask:function(){
						this.complete();
					}
				})],
				onComplete:function(){
					alert(this.name + " is complete!");
				}
			});

			sequence.start();

	 */
	 var SequenceTask = MonkeyBars.SequenceTask = function(attributes){
	 	// refernce for readability
	 	var task = this;

	 	// super
	 	TaskGroup.call(task,attributes);
	 }

	SequenceTask.prototype = Object.create(TaskGroup.prototype, {
		type: {
			value: TYPE_SEQUENCE,
			writable: true
		},
		name: {
			value: TYPE_SEQUENCE,
			writable: true
		},
		startNextSubTask: {
			value: function() {
				if(this.state >= STATE_CANCELED) return;
				if(this.tasks && this.currentIndex < this.tasks.length) {
					var skipped = this.processSubTask(this.tasks[this.currentIndex++]);
					if(skipped) this.startNextSubTask();
				} else {
					this.complete();
				}
			},
			writable: true
		},
		onSubTaskComplete: {
			value: function() {
				if(this.state == STATE_CANCELED) return;
				this.startNextSubTask();
			},
			writable: true
		},
		onSubTaskCancel: {
			value: function(task) {
				//[super onSubTaskCancel:task];
				if(this.state != STATE_CANCELED) this.startNextSubTask();
			},
			writable: true
		},
		performTask: {
			value: function() {
				this.startNextSubTask();
			},
			writable: true
		}
	});

	// add the extend functionality to all of the task constructor functions
	Task.extend = TaskGroup.extend = ParallelTask.extend = SequenceTask.extend = extend;

	// ===================================================================
	// === Task Decorators ===============================================
	// ===================================================================

	/**
	 * ForTaskDecorator description
	 *
	 * @method ForTaskDecorator
	 * @param {Object} task
	 */
	var ForTaskDecorator = function(task) {
	 	task.itterationIndex = 0;
	 	task.complete = function() {
			if(this.itterationIndex != this.count - 1) {
				resetTask(this);
				this.itterationIndex++;
				if(this.loggingEnabled) console.log("Completed:" + this.name + " " + this.itterationIndex + " out of " + this.count + " times");
				this.performTask();
			} else {
				Task.prototype.complete.call(this);
			}
		}
	}

	/**
	 * WhileTaskDecorator description
	 *
	 * @method WhileTaskDecorator
	 * @param {Object} task
	 */
	 var WhileTaskDecorator = function(task) {
		task.interval = task.interval ? task.interval : TIMEOUT_INTERVAL;
		task.complete = function() {
			if(this.while()) {
				this.state = STATE_INITIALIZED;
				var delegate = this;
				if(this.interval != 0) {
					setTimeout(function() { delegate.start(); }, this.interval);
				} else {
					delegate.start();
				}

			} else {
				Task.prototype.complete.call(this);
			}
		}
	}

	/**
	 * WhenTaskDecorator description
	 *
	 * @method WhenTaskDecorator
	 * @param {Object} task
	 */
	var WhenTaskDecorator = function(task) {
		task.decorators.push(DECORATOR_WHEN);
		task.interval = task.interval ? task.interval : TIMEOUT_INTERVAL;
		task.start = function(){
			if(this.when()){
				Task.prototype.start.call(this);
			}else{
				var delegate = this;
				setTimeout(function(){ delegate.start(); },this.interval);
			}
		}
	}

	// ===================================================================
	// === Public Interface ==============================================
	// ===================================================================

	// set publicly available states
	MonkeyBars.TaskStates = {
		Initialized:STATE_INITIALIZED,
		Started:STATE_STARTED,
		Canceled:STATE_CANCELED,
		Faulted:STATE_FAULTED,
		Completed:STATE_COMPLETED
	};

	// set publicly available types
	MonkeyBars.TaskTypes = {
		Parallel:TYPE_PARALLEL,
		Sequence:TYPE_SEQUENCE,
		Simple:TYPE_SIMPLE
	};

	// set publicly available decorators
	MonkeyBars.TaskDecorators = {
		For:DECORATOR_FOR,
		When:DECORATOR_WHEN,
		While:DECORATOR_WHILE
	};

	// set MonkeyBars to our root object
	root.MonkeyBars = MonkeyBars;

}(this));