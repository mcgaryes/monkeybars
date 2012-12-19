/*!
 *
 * MonkeyBars 
 * 
 * Task library that provides a simple structure for handling singular, sequential 
 * and parallel units of code. 
 *
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
	var UNDEFINED_TASK		=	"Task is undefined.";
	var MISSING_ATTRIBUTES	=	"You must pass some attributes in order to create a task.";

	// ===================================================================
	// === Private Variables =============================================
	// ===================================================================

	/**
     * A dictionary of dependencies for sub tasks
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
		if(typeof module !== 'undefined' && module.exports) {
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
	var createTaskWithOptions = function(attributes){

		// check for attributes
		if(!attributes) {
			throw MISSING_ATTRIBUTES;
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

		}

		return task;
	}

	/**
	 * Creates an array of tasks based on the options array passed.
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
	 * Creates property descriptors from the passes attributes.
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
	 * Resets the task to its original non executed state.
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
	 * Generates a unique id for each task.
	 *
	 * @method generateUniqueId
	 * @param {String} prefix
	 * @return {String} tid
	 * @private
	 */
	var generateUniqueId = function(prefix){
  		var id = taskIdCounter++;
  		var tid = prefix ? prefix + id : TID_PREFIX + id;
  		return tid;
	}

	/**
	 * Determains whether the first task is dependent on the second.
	 *
	 * @method isTaskDependentOnTask
	 * @param {Task} task1
	 * @param {Task} task2
	 * @private
	 */
	var isTaskDependentOnTask = function(task1,task2) {
		var dependencies = task1.dependencies;
		if(dependencies) {
			var totalDependencies = dependencies.length;
			for (var i = 0; i <totalDependencies; i++) {
				var dependency = dependencies[i];
				if (dependency == task2.tid) {
					return true;
				} else if (dependency == task2.id) {
					return true;
				} else if (dependency == task2.name && task2.name !== "undefined") {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Extention functionality for various task types.
	 *
	 * @method extend
	 * @for MonkeyBars
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
			get: function() {
				return TYPE_SIMPLE;
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
				if(this.id) return this.id;
				if(this.name) return this.name;
				return this.type;
			}
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
		 * Calling this method cancels the task. However it is up to the instance to handle 
		 * the canceled state.
		 * 
		 * @for Task
		 * @method cancel
		 * @example

			var task = new MonkeyBars.Task({
				performTask:function(){
					if(true){
						this.cancel();
					}
				}
			});

			task.start();

		 */
		cancel: {
			value: function() {
				if(this.state > STATE_STARTED) return;
				this.state = STATE_CANCELED;
				if(this.loggingEnabled) console.log("Canceled:" + this.displayName);
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

			var task = new MonkeyBars.Task({
				performTask:function(){
					this.complete();
				}
			});

			task.start();

		 */
		complete: {
			value: function() {
				if(this.state > STATE_STARTED) return;
				this.state = STATE_COMPLETED;
				if(this.loggingEnabled) console.log("Completed:" + this.displayName);
				this.executionTime = (new Date().getTime()) - this.startTime;
				this.onComplete();
				this.onChange(this.state);
			},
			writable: true
		},

		/**
		 * Calling this method to fault a task. If it is part of a group task this will 
		 * also call the groups fault method passing the error up to the group.
		 * 
		 * @for Task
		 * @method fault
		 * @param {String} error Message associated with the cause of the fault.
		 * @example

			var task = new MonkeyBars.Task({
				performTask:function(){
					var a = "a";
					if(a != "b") {
						this.fault("a != b");
					}
				}
			});

			task.start();

		 */
		fault: {
			value: function(error) {
				if(this.state >= STATE_CANCELED) return;
				this.state = STATE_FAULTED;
				if(this.loggingEnabled) console.log("Faulted:" + this.displayName);
				this.onChange(this.state, error);
				this.onFault(error);
			},
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

			var task = new MonkeyBars.Task({
				performTask:function(){
					this.complete();
				},
				onChange:function(state,error){
					if(state == MonkeyBars.TaskStates.Completed){
						alert("complete");
					}
				}
			});

			task.start();

		 */
		onChange: {
			value: function(state, error) {},
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
		 * Convenience method called when the task completes.
		 * 
		 * @for Task
		 * @method onComplete
		 */
		onComplete: {
			value: function() {},
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
		 * This method is required for **simple** tasks and will throw an exception if it 
		 * is called and not overridden. If you overwrite this method on a task group
		 * then you need to make sure that you call the extended/implemented classes
		 * original prototype method (see the example below).
		 * 
		 * @for Task
		 * @method performTask
		 * @required
		 * @example

			var parallel = new MonkeyBars.ParallelTask({
				...
				performTask:function(){
					// custom functionality
					MonkeyBars.ParallelTask.prototype.performTask.call(this);
				}
				...
			})

		 */
		performTask: {
			value: function() { throw OVERRIDE_NEEDED; },
			writable: true
		},

		/**
		 * Kicks off the execution of the task by calling the tasks `performTask` method. 
		 * This method can only be run once on a task.
		 * 
		 * @for Task
		 * @method start
		 */
		start: {
			value:function() {
				if(this.state >= STATE_STARTED) return;
				this.startTime = new Date().getTime();
				this.state = STATE_STARTED;
				if(this.loggingEnabled) console.log("Started:" + this.displayName);
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

	 	// create dependency map and populate it with subtask tids
	 	task.dependencyMap = {};
	 	if(task.tasks){
		 	for (var i = 0; i < task.tasks.length; i++) {
		 		var subtask = task.tasks[i];
		 		this.dependencyMap[subtask.tid] = [];
				task.setDependeciesForTask(subtask);
		 	};
	 	}

	 	// super
	 	Task.call(task,attributes);
	 }

	TaskGroup.prototype = Object.create(Task.prototype, {
		
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
		 * Adds a subtask to the groups queue. This is helpful when you want to add
		 * a sub task after instantiation.
		 * 
		 * @for TaskGroup
		 * @method addSubTask
		 * @param {Object} task Either an object containing attributes of a task or
		 * an already instantiated task
		 * @example

			var parallel = new MonkeyBars.ParallelTask();
			
			parallel.addSubTask({
				name:"subtask",
				performTask:function(){
					this.complete();
				}
			});

			var simple = new MonkeyBars.simple({
				name:"subtask",
				performTask:function(){
					this.complete();
				}
			});
			parallel.addSubTask(simple);


		 */
		addSubTask: {
			value: function(task) {
				if(!task.tid) task = createTaskWithOptions(task);
				this.setDependeciesForTask(task);
				this.tasks.push(task);
			},
			writable: true
		},

		/**
		 * description
		 * 
		 * @for TaskGroup
		 * @method addSubTaskAfterTask
		 * @param {Object} task Either an object containing attributes of a task or
		 * @param {Object} afterTask Reference to an already added task
		 * @example

			var parallel = new MonkeyBars.ParallelTask({
				tasks:[task1,task3]
			});

			var task2 = new MonkeyBars.Task();
			parallel.addTaskAfterTask(task2,task1);

		 */
		addSubTaskAfterTask: {
			value: function(task, afterTask) {
				if(!task || this.state == STATE_CANCELED) return;
				if(!task.tid) task = createTaskWithOptions(task);
				this.setDependeciesForTask(task);
				var index = this.tasks.indexOf(afterTask);
				this.tasks.splice(index, 0, task);
			},
			writable: true
		},

		/**
		 * Called when a sub task completes. Must be overridden with functionality 
		 * provided by the extending class.
		 * 
		 * @for TaskGroup
		 * @method onSubTaskComplete
		 */
		onSubTaskComplete: {
			value: function() { throw OVERRIDE_NEEDED; },
			writable: true
		},

		/**
		 * Called when a subtask calls its fault method.
		 * 
		 * @for TaskGroup
		 * @method onSubTaskFault
		 * @param {String} error Error message.
		 */
		onSubTaskFault: {
			value: function(error) { this.fault(error); },
			writable: true
		},

		/**
		 * Called when a subtask calls its cancel method. When a subtask is canceled
		 * any other subtasks that are dependent on the canceled task are cancled.
		 * 
		 * @for TaskGroup
		 * @method onSubTaskCancel
		 * @param {Task} task The task that was just cancled
		 */
		onSubTaskCancel: {
			value: function(task) {
				for (var i = 0; i < this.tasks.length; i++) {
					if(isTaskDependentOnTask(this.tasks[i],task)){
						this.tasks[i].state = STATE_CANCELED;
					}
				}
			},
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

				if(!task) throw UNDEFINED_TASK;

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
				if(!task) return;
				var index = this.tasks.indexOf(task);
				this.tasks.splice(index, 1);
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

			var parallel = new MonkeyBars.ParallelTask({
				tasks:[task1,task3]
			});

			parallel.getTaskByTid(task1.tid);

		 */
		getTaskByTid: {
			value: function(tid) {
				for(var i = 0; i < this.tasks.length; i++) {
					var task = this.tasks[i];
					if(task.tid == tid) return task;
				};
			},
			writable: true
		},

		/**
		 * Return a Task object, if it exists, based on the `id` passed.
		 * 
		 * @for TaskGroup
		 * @method getTaskById
		 * @param {String} id The user defined id
		 */
		getTaskById: {
			value: function(id) {
				for(var i = 0; i < this.tasks.length; i++) {
					var task = this.tasks[i];
					if(task.id == id) return task;
				};
			},
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
				for(var i = 0; i < this.tasks.length; i++) {
					var task = this.tasks[i];
					if(task.name == name) return task;
				};
			},
			writable: true
		},

		/**
		 * Cancel the group and cancel all of its subtasks
		 * 
		 * @for TaskGroup
		 * @method cancel
		 */
		cancel:{
		 	value:function(){

		 		// call cancel on this task
		 		Task.prototype.call(this);
		 		
		 		// cancel all of this tasks subtasks
		 		for (var i = 0; i < this.tasks.length; i++) {
		 			// we only want to cancel those tasks that are currently running
					// otherwise we want to set the canceled flag
		 			var task = this.tasks[i];
		 			if (task.state>STATE_INITIALIZED){
		 				task.cancel();
		 			} else {
		 				task.state = STATE_CANCELED;
		 			}
		 		};

			},
			writable: true
		},

		/**
		 * Sets dependencies for the passed task.
		 *
		 * @method setDependeciesForTask
		 * @param {Task} task
		 * @static
		 */
		setDependeciesForTask: {
		 	value:function(task){
				if(task.dependencies){
					var totalDependencies = task.dependencies.length;
					for (var i = 0; i < totalDependencies; i++) {
						var dependency = task.dependencies[i];
						if(dependency.tid) {
							this.dependencyMap[task.tid].push(dependency.tid);
						} else {
							this.dependencyMap[task.tid].push(dependency);
						}
					};

				}
			},
			writable: false
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

		/**
		 * The kind of task 
		 * 
		 * @for ParallelTask
		 * @property type
		 * @type String
		 * @readonly
		 */
		type: {
			get: function() {
				return TYPE_PARALLEL;
			}
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
				if(!this.tasks) return true;
				for(var i = 0; i < this.tasks.length; i++) {
					var task = this.tasks[i];
					if(task.state != STATE_CANCELED) return false;
				}
				return true;
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
				for(var i = 0; i < this.tasks.length; i++) {
					var task = this.tasks[i];
					this.currentIndex++;
					this.processSubTask(task);
				}
			},
			writable: true
		},

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
				if(!task || task.state == STATE_CANCELED) return;
				this.currentIndex++;
				if(!task.tid) task = createTaskWithOptions(task);
				this.tasks.push(task);
				this.processSubTask(task);
			},
			writable: true
		},

		/**
		 * Overridden from TaskGroup. This method is run everytime a sub task
		 * completes. When all subtasks are complete the groups complete method
		 * is called.
		 * 
		 * @for ParallelTask
		 * @method onSubTaskComplete
		 */
		onSubTaskComplete: {
			value: function() {
				this.currentIndex = this.currentIndex++;
				if(this.currentIndex == this.tasks.length) {
					this.complete();
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
		
		/**
		 * The kind of task 
		 * 
		 * @for SequenceTask
		 * @property type
		 * @type String
		 * @readonly
		 */
		type: {
			get: function() {
				return TYPE_SEQUENCE;
			}
		},

		/**
		 * Starts the next task in the queue after its previous sibling has completed.
		 * 
		 * @for SequenceTask
		 * @method startNextSubTask
		 */
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

		/**
		 * Overridden from TaskGroup. As long as the group has not been canceled,
		 * when a sub task completes it starts the next sibling in the queue.
		 * 
		 * @for SequenceTask
		 * @method onSubTaskComplete
		 */
		onSubTaskComplete: {
			value: function() {
				if(this.state == STATE_CANCELED) return;
				this.startNextSubTask();
			},
			writable: true
		},

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
				TaskGroup.prototype.onSubTaskCancel.call(this,task);
				if(this.state != STATE_CANCELED) this.startNextSubTask();
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
		}
	});

	// add the extend functionality to all of the task constructor functions
	Task.extend = TaskGroup.extend = ParallelTask.extend = SequenceTask.extend = extend;

	// ===================================================================
	// === Task Decorators ===============================================
	// ===================================================================

	/**
	 * Decorator to provide for loop functionality for the task. The task executes
	 * as many times as referenced by the count attribute provided by the instance.
	 * 
	 * @for MonkeyBars
	 * @method ForTaskDecorator
	 * @param {Object} task
	 * @private
	 */
	var ForTaskDecorator = function(task) {
		task.decorators.push(DECORATOR_FOR);
	 	task.itterationIndex = 0;
	 	task.complete = function() {
			if(this.itterationIndex != this.count - 1) {
				resetTask(this);
				this.itterationIndex++;
				if(this.loggingEnabled) console.log("Completed:" + this.displayName + " " + this.itterationIndex + " out of " + this.count + " times");
				this.performTask();
			} else {
				Task.prototype.complete.call(this);
			}
		}
	}

	/**
	 * Decorator to provide while loop functionaliy. The task executed until the `while`
	 * method returns false.
	 * 
	 * @for MonkeyBars
	 * @method WhileTaskDecorator
	 * @param {Object} task
	 * @private
	 */
	var WhileTaskDecorator = function(task) {
		task.decorators.push(DECORATOR_WHILE);
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
	 * The task doesnt execute until the when method provided returns true.
	 *
	 * @for MonkeyBars
	 * @method WhenTaskDecorator
	 * @param {Object} task
	 * @private
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

	/**
	 * description needed
	 *
	 * @property TaskStates
	 * @for MonkeyBars
	 * @type Object
	 * @static
	 */
	MonkeyBars.TaskStates = {
		Initialized:STATE_INITIALIZED,
		Started:STATE_STARTED,
		Canceled:STATE_CANCELED,
		Faulted:STATE_FAULTED,
		Completed:STATE_COMPLETED
	};

	/**
	 * description needed
	 *
	 * @property TaskTypes
	 * @for MonkeyBars
	 * @type Object
	 * @static
	 */
	MonkeyBars.TaskTypes = {
		Parallel:TYPE_PARALLEL,
		Sequence:TYPE_SEQUENCE,
		Simple:TYPE_SIMPLE
	};

	/**
	 * description needed
	 *
	 * @property TaskDecorators
	 * @for MonkeyBars
	 * @type Object
	 * @static
	 */
	MonkeyBars.TaskDecorators = {
		For:DECORATOR_FOR,
		When:DECORATOR_WHEN,
		While:DECORATOR_WHILE
	};

}(this));