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

		if(type) {
			if(type == TYPE_SIMPLE) {
				return new Task(attributes);
			} else if(type == TYPE_SEQUENCE) {
				return new SequenceTask(attributes);
			} else if(type == TYPE_PARALLEL){
				return new ParallelTask(attributes);
			}
		} else {
			if (!tasks) {
				return new Task(attributes);
			} else {
				return new SequenceTask(attributes);
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
	 * Extends a task with a set of attributes
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

	/**
	 * Generates a unique id for each task
	 */
	var generateUniqueId = function(prefix){
  		var id = '' + taskIdCounter++;
    	return prefix ? prefix + id : TID_PREFIX + id;
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
	var Task = MonkeyBars.Task = function(attributes,options) {

		var task = Task.extend(attributes);
		task.tid = generateUniqueId();
		task.decorators = [];

		// decorate our task
		if(task.count) ForTaskDecorator(task);
		if(task.when) WhenTaskDecorator(task);
		if(task.while) WhileTaskDecorator(task);

		return task;
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
	var TaskGroup = MonkeyBars.TaskGroup = function(attributes,options){
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
		currentIndex:0,
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
				this.onSubTaskCancel(task);
				return true;
			}
			
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
		},
		getTaskById:function(tid){
			for (var i = 0; i < this.tasks.length; i++) {
				var task = this.tasks[i];
				if(task.tid == tid) return task;
			};
		}
	};

	/**
	 * ParallelTask description.
	 *
	 * @method ParallelTask
	 * @param {Object} attributes
	 * @param {Object} options
	 */
	var ParallelTask = MonkeyBars.ParallelTask = function(attributes,options) { 
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
			this.currentIndex = this.currentIndex++;
			if(this.currentIndex == this.tasks.length) {
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
	var SequenceTask = MonkeyBars.SequenceTask = function(attributes,options) {
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
	 * description.
	 *
	 * @method ForTaskDecorator
	 * @param {Object} task
	 * @return Object decorated task
	 */
	var ForTaskDecorator = function(task) {
	 	task.count = task.count ? task.count : 1;
		task.itterationIndex = ForTaskDecorator.prototype.itterationIndex;
		task.complete = ForTaskDecorator.prototype.complete;
		task.decorators.push(DECORATOR_FOR);
		return task;
	};

	/**
	 * prototype description.
	 *
	 * @property ForTaskDecorator prototype
	 * @type Object
	 */
	ForTaskDecorator.prototype = {
		itterationIndex:0,
		complete:function() {
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
	 * description.
	 *
	 * @method WhileTaskDecorator
	 * @param {Object} task
	 * @return Object decorated task
	 */
	 var WhileTaskDecorator = function(task) {
	 	task.interval = task.interval ? task.interval : 100;
	 	task.complete = WhileTaskDecorator.prototype.complete;
	 	task.decorators.push(DECORATOR_WHILE);
		return task;
	 };

	/**
	 * prototype description.
	 *
	 * @property WhileTaskDecorator prototype
	 * @type Object
	 */
	WhileTaskDecorator.prototype = {
		complete:function(){
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
	};

	/**
	 * description.
	 *
	 * @method WhenTaskDecorator
	 * @param {Object} task
	 * @return Object decorated task
	 */
	var WhenTaskDecorator = function(task) {
		task.start = WhenTaskDecorator.prototype.start;
		task.decorators.push(DECORATOR_WHEN);
		return task;
	};

	/**
	 * prototype description.
	 *
	 * @property WhenTaskDecorator prototype
	 * @type Object
	 */
	WhenTaskDecorator.prototype = {
		start:function(){
			var interval = this.interval ? this.interval : 10;
			if(this.when()){
				Task.prototype.start.call(this);
			}else{
				var delegate = this;
				setTimeout(function(){ delegate.start(); },interval);
			}
		}
	};

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