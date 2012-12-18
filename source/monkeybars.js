/*! monkeybars v0.0.1 */
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

	// ===================================================================
	// === Private Variables =============================================
	// ===================================================================

	var root = this;
	var taskIdCounter = 0;
	var MonkeyBars = {};

	// ===================================================================
	// === Helper Functions ==============================================
	// ===================================================================

	/**
	 * Creates task based on the options passed
	 *
	 * @method createTaskWithOptions
	 * @param {Object} options
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

		// create the property descriptors that we'll apply to the object
		var properties = createPropertyDescriptorsWithAttributes(attributes);

		if(type) {
			if(type == TYPE_SIMPLE) {
				task = Object.create(Task,properties);
			} else if(type == TYPE_SEQUENCE) {
				task = Object.create(SequenceTask,properties);
			} else if(type == TYPE_PARALLEL){
				task = Object.create(ParallelTask,properties);
			}
		} else {
			if (!tasks) {
				task = Object.create(Task,properties);
			} else {
				task = Object.create(SequenceTask,properties);
			}
		}

		// decorate out task
		if(task.count) ForTaskDecorator(task);
		if(task.when) WhenTaskDecorator(task);
		if(task.while) WhileTaskDecorator(task);
		
		return task;
	}

	/**
	 * Creates property descriptors from the passes attributes
	 *
	 * @method createPropertyDescriptorsWithAttributes
	 * @param {Object} attributes
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
	 * Creates an array of tasks based on the options array passed
	 *
	 * @method createSubTasksFromTaskOptionsArray
	 * @param {Array} tasks
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
	 * Resets the task to its original non executed state
	 *
	 * @method resetTask
	 * @param {Object} task
	 */
	var resetTask = function(task){
		task.state = STATE_INITIALIZED;
		if(task.type != TYPE_SIMPLE && task.tasks){
			//if(task.type == TYPE_PARALLEL) task.currentIndex = task.tasks.length;
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
	 */
	var generateUniqueId = function(prefix){
  		var id = '' + taskIdCounter++;
    	return prefix ? prefix + id : TID_PREFIX + id;
	}

	// ===================================================================
	// === Task Constructor ==============================================
	// ===================================================================

	/**
	 * Generates a task object based on the attributes passed
	 *
	 * @method create
	 * @param {Object} attributes
	 * @return {Object} task object
	 */
	var create = MonkeyBars.create = function(attributes){
		return createTaskWithOptions(attributes);
	}

	// ===================================================================
	// === Tasks Objects =================================================
	// ===================================================================

	/**
	 * Task description.
	 *
	 * @property Task
	 * @type Object
	 */
	var Task = MonkeyBars.Task = Object.create({}, {
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
			value: function(state, error) {
				// empty by default
			},
			writable: true
		},
		onStart: {
			value: function() {
				// empty by default
			},
			writable: true
		},
		onFault: {
			value: function(error) {
				// empty by default
			},
			writable: true
		},
		onComplete: {
			value: function() {
				// empty by default
			},
			writable: true
		},
		onCancel: {
			value: function() {
				// empty by default
			},
			writable: true
		},
		performTask: {
			value: function() {
				throw "'performTask' method should be overridden";
			},
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
	 * TaskGroup description.
	 *
	 * @property Task
	 * @type Object
	 */
	var TaskGroup = MonkeyBars.TaskGroup = Object.create(Task, {
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
	 * ParallelTask description.
	 *
	 * @property ParallelTask
	 * @type Object
	 */
	var ParallelTask = MonkeyBars.ParallelTask = Object.create(TaskGroup, {
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
	 * SequenceTask description.
	 *
	 * @property SequenceTask
	 * @type Object
	 */
	var SequenceTask = MonkeyBars.SequenceTask = Object.create(TaskGroup, {
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
				Task.complete.call(this);
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
	 	task.complete = function(){
			if(this.while()) {
				this.state = STATE_INITIALIZED;
				var delegate = this;
				if(this.interval != 0){
					setTimeout(function(){ delegate.start(); },this.interval);
				}else{
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
		task.start = function(){
			var interval = this.interval ? this.interval : 10;
			if(this.when()){
				Task.prototype.start.call(this);
			}else{
				
				setTimeout(function(){ delegate.start(); },interval);
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