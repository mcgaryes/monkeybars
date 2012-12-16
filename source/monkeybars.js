/*! monkeybars v0.0.1 */
(function() {

	// reference to window
	var root = this;

	// ===================================================================
	// === Constants =====================================================
	// ===================================================================

	// state constants
	var STATE_INITIALIZED	=	0;
	var STATE_STARTED		=	1;
	var STATE_CANCELED		=	2;
	var STATE_FAULTED		=	3;
	var STATE_COMPLETED		=	4;

	// type constants
	var TYPE_PARALLEL		=	"parallel";
	var TYPE_SEQUENCE		=	"sequence";
	var TYPE_SIMPLE			=	"simple";

	// decorators
	var DECORATOR_FOR		=	"for";
	var DECORATOR_WHEN		=	"when";
	var DECORATOR_WHILE		=	"while";

	// ===================================================================
	// === Helper Functions ==============================================
	// ===================================================================

	/**
	 * Adds any decorations based on child properties
	 *
	 * @method decorateChildTask
	 * @param {Object} child
	 */
	var decorateChildTask = function(child) {
		console.log("count = " + child.count);
		if(child.count) ForTaskDecorator.decorate(child);
		if(child.when) WhenTaskDecorator.decorate(child);
		if(child.while) WhileTaskDecorator.decorate(child);
	}

	/**
	 * Creates task based on the options passed
	 *
	 * @method createTaskWithOptions
	 * @param {Object} options
	 */
	var createTaskWithOptions = function(options){
		
		var task;

		if(!options) {
			throw "No options passed";
			return;
		}

		var type = options.type;
		var tasks = options.tasks;

		if(type) {
			if(type == TYPE_SIMPLE) {
				return Task.extend(options);
			} else if(type == TYPE_SEQUENCE) {
				return SequenceTask.extend(options);
			} else if(type == TYPE_PARALLEL){
				return ParallelTask.extend(options);
			}
		} else {
			if (!tasks) {
				return Task.extend(options);
			} else {
				return SequenceTask.extend(options);
			}
		}

		return task;
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
	 * Extends one object from another
	 *
	 * @method extend
	 * @param {Object} protoProps
	 * @param {Object} staticProps
	 */
	var extend = function(attributes) {
		var parent = this.prototype;
    	var child = {};

		for (var prop in parent) child[prop] = parent[prop];
		for (var prop in attributes) child[prop] = attributes[prop];

		return child;
	}

	// ===================================================================
	// === Task Types ====================================================
	// ===================================================================

	/**
	 * Creates a copy of the task prototype and returns the result
	 *
	 * @method Task
	 * @param {Object} attributes
	 * @param {Object} options
	 */
	var Task = function(attributes,options) {
		return Task.extend(attributes);
	}

	/**
	 * Task prototype description.
	 *
	 * @property Task prototype
	 * @type Object
	 */
	Task.prototype = {
		type:TYPE_SIMPLE,
		name:TYPE_SIMPLE,
		state:STATE_INITIALIZED,
		decorators:[],
		cancel:function(){
			if(this.state > STATE_STARTED) return;
			this.state = STATE_CANCELED;
			if(this.loggingEnabled) console.log("Canceled:" + this.name);
			this.onChange(this.state);
			this.onCancel();
		},
		complete:function(){
			if(this.state > STATE_STARTED) return;
			this.state = STATE_COMPLETED;
			if(this.loggingEnabled) console.log("Completed:" + this.name);
			this.executionTime = ( new Date().getTime() )-this.startTime;
			this.onComplete();
			this.onChange(this.state);
		},
		fault:function(error){
			if(this.state >= STATE_CANCELED) return;
			this.state = STATE_FAULTED;
			if(this.loggingEnabled) console.log("Faulted:" + this.name);
			this.onChange(this.state,error);
			this.onFault(error);
		},
		onChange:function(state,error){
			// empty by default
		},
		onStart:function() {
			// empty by default
		},
		onFault:function(error) {
			// empty by default
		},
		onComplete:function() {
			// empty by default
		},
		onCancel:function() {
			// empty by default
		},
		performTask:function(){
			throw "'performTask' method should be overridden";
		},
		start:function(){
			if(this.state >= STATE_STARTED) return;
			this.startTime = new Date().getTime();
			this.state = STATE_STARTED;
			if(this.loggingEnabled) console.log("Started:" + this.name);
			this.onChange(this.state);
			this.performTask();
			this.onStart();
		}
	};

	/**
	 * TaskGroup description.
	 *
	 * @method TaskGroup
	 * @param {Object} attributes
	 * @param {Object} options
	 */
	var TaskGroup = function(attributes,options){
		attributes = TaskGroup.extend(attributes);
		attributes.tasks = createSubTasksFromTaskOptionsArray(attributes.tasks);
		return new Task(attributes,options);
	}

	/**
	 * TaskGroup prototype description.
	 *
	 * @property TaskGroup prototype
	 * @type Object
	 */
	TaskGroup.prototype = {
		addSubTask:function(task){
			if(!task.id) task = createTaskWithOptions(task);
			this.tasks.push(task);
		},
		addSubTaskAfterTask:function(task,afterTask){
			if (!task || this.state == STATE_CANCELED) return;
			if(!task.id) task = createTaskWithOptions(task);
			var index = this.tasks.indexOf(afterTask);
			this.tasks.splice(index,0,task);
		},
		onSubTaskComplete:function(){
			throw "This is an abstract method and must be implemented in a subclass.";
		},
		onSubTaskFault:function(error){
			this.fault(error);
		},
		onSubTaskCancel:function(task){
			this.cancel();
		},
		processSubTask:function(task){
			
			if (!task) throw "You cannot process a task with a nil value.";
			
			if(task.state == STATE_CANCELED) {
				console.log("task is canceled");
				this.onSubTaskCancel(task);
				return true;
			}
			
			// set concurrency for the sub tasks
			//task.concurrent = self.concurrent;
			task.group = this;
			task.loggingEnabled = this.loggingEnabled;
			
			// set execution block
			task.onChange = function(state,error){
				if(state == STATE_COMPLETED) this.group.onSubTaskComplete();
				else if(state == STATE_FAULTED) this.group.onSubTaskFault(error);
				else if(state == STATE_CANCELED) this.group.onSubTaskCancel(task);
			}
			
			task.start();
			
			return false;
		},
		removeSubTask:function(task){
			if (!task) return;
			var index = this.tasks.indexOf(task);
			this.tasks.splice(index,1);
		}
	};

	/**
	 * ParallelTask description.
	 *
	 * @method ParallelTask
	 * @param {Object} attributes
	 * @param {Object} options
	 */
	var ParallelTask = function(attributes,options) { 
		attributes = ParallelTask.extend(attributes);
		return new TaskGroup(attributes,options);
	}

	/**
	 * ParallelTask description.
	 *
	 * @property ParallelTask
	 * @type Object
	 */
	ParallelTask.prototype = {
		type:TYPE_PARALLEL,
		name:TYPE_PARALLEL,
		currentIndex:0,
		hasNoEnabledSubTasks:function(){
			for (var i = 0; i < this.tasks.length; i++) {
				var task = this.tasks[i];
				if(task.state != STATE_CANCELED) return false;
			}
			return true;
		},
		processSubTasks:function(){
			for (var i = 0; i < this.tasks.length; i++) {
				var task = this.tasks[i];
				this.currentIndex++;
				this.processSubTask(task);
			}
		},
		addSubTask:function(task) {
			if (!task || task.state == STATE_CANCELED) return;
			this.currentIndex++;
			if(!task.id) task = new Task(task);
			this.tasks.push(task);
			this.processSubTask(task);
		},
		onSubTaskComplete:function(){
			if(this.currentIndex-- <= 1) {
				this.complete();
			}
		},
		performTask:function(){
			if (this.hasNoEnabledSubTasks()){
				this.complete();
			}else{
				this.processSubTasks();
			}
		}
	};

	/**
	 * SequenceTask description.
	 *
	 * @method SequenceTask
	 * @param {Object} attributes
	 * @param {Object} options
	 */
	var SequenceTask = function(attributes,options) {
		attributes = SequenceTask.extend(attributes);
		return new TaskGroup(attributes,options);
	}

	/**
	 * SequenceTask prototype description.
	 *
	 * @property SequenceTask prototype
	 * @type Object
	 */
	SequenceTask.prototype = {
		type:TYPE_SEQUENCE,
		name:TYPE_SEQUENCE,
		currentIndex:0,
		startNextSubTask:function(){
			if(this.state >= STATE_CANCELED) return;
			if (this.tasks && this.currentIndex < this.tasks.length){
				var skipped = this.processSubTask(this.tasks[this.currentIndex++]);
				if (skipped) this.startNextSubTask();
			}else{
				this.complete();
			}
		},
		onSubTaskComplete:function(){
			if(this.state == STATE_CANCELED) return;
			this.startNextSubTask();
		},
		onSubTaskCancel:function(task){
			//[super onSubTaskCancel:task];
			if(this.state != STATE_CANCELED) this.startNextSubTask();
		},
		performTask:function(){
			this.startNextSubTask();
		}
	};

	// set the extend method on all task types
	Task.extend = TaskGroup.extend = ParallelTask.extend = SequenceTask.extend = extend;

	// ===================================================================
	// === Task Decorators ===============================================
	// ===================================================================

	/**
	 * ForTaskDecorator description.
	 *
	 * @property ForTaskDecorator
	 * @type Object
	 */
	var ForTaskDecorator = {
		prototype:{
			itterationIndex:0,
			complete:function() {
				var count = this.count ? this.count : 1;
				if(this.itterationIndex != count - 1) {
					this.state = STATE_INITIALIZED;
					this.itterationIndex++;
					if(this.loggingEnabled) console.log("Completed:" + this.name + " " + this.itterationIndex + " out of " + count + " times");
					this.performTask();
				} else {
					Task.prototype.complete.call(this);
				}
			}
		},
		decorate:function(child){
			console.log("FOR");
			child.decorators.push(DECORATOR_FOR);
			for (var prop in ForTaskDecorator.prototype) {
				child[prop] = ForTaskDecorator.prototype[prop];
			}
		}
	};

	/**
	 * WhileTaskDecorator description.
	 *
	 * @property WhileTaskDecorator
	 * @type Object
	 */
	var WhileTaskDecorator = {
		prototype:{
			complete:function(){
				var interval = this.interval ? this.interval : 100;
				if(this.while()) {
					this.state = STATE_INITIALIZED;
					var delegate = this;
					if(interval != 0){
						setTimeout(function(){ delegate.start(); },interval);
					}else{
						delegate.start();
					}
				} else {
					Task.prototype.complete.call(this);
				}
			}
		},
		decorate:function(child){
			child.decorators.push(DECORATOR_WHILE);
			for (var prop in WhileTaskDecorator.prototype) {
				child[prop] = WhileTaskDecorator.prototype[prop];
			}
		}
	};

	/**
	 * WhenTaskDecorator description.
	 *
	 * @property WhenTaskDecorator
	 * @type Object
	 */
	var WhenTaskDecorator = {
		prototype:{
			start:function(){
				var interval = this.interval ? this.interval : 10;
				if(this.when()){
					Task.prototype.start.call(this);
				}else{
					var delegate = this;
					setTimeout(function(){ delegate.start(); },interval);
				}
			}
		},
		decorate:function(child){
			child.decorators.push(DECORATOR_WHEN);
			for (var prop in WhenTaskDecorator.prototype) {
				child[prop] = WhenTaskDecorator.prototype[prop];
			}
		}
	};

	// ===================================================================
	// === Public Interface ==============================================
	// ===================================================================

	root.MonkeyBars = {
		ParallelTask:ParallelTask,
		SequenceTask:SequenceTask,
		Task:Task,
		TaskStates:{
			Initialized:STATE_INITIALIZED,
			Started:STATE_STARTED,
			Canceled:STATE_CANCELED,
			Faulted:STATE_FAULTED,
			Completed:STATE_COMPLETED
		},
		TaskTypes:{
			Parallel:TYPE_PARALLEL,
			Sequence:TYPE_SEQUENCE,
			Simple:TYPE_SIMPLE
		},
		TaskDecorators:{
			For:DECORATOR_FOR,
			When:DECORATOR_WHEN,
			While:DECORATOR_WHILE
		}
	};

}(this));