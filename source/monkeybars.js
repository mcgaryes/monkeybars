
(function() {

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

	// creates task based on the options passed
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

	// creates an array of tasks based on the options array passed
	var createSubTasksFromTaskOptionsArray = function(tasks){
		var tempTasks = [];
		if(tasks) {
			for(var i=0;i<tasks.length;i++){
				tempTasks.push(createTaskWithOptions(tasks[i]));
			}
		}
		return tempTasks;
	}

	// task
	var Task = {
		prototype:{
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
				this.onChange(this.state);
				this.onComplete();
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
				this.state = STATE_STARTED;
				if(this.loggingEnabled) console.log("Started:" + this.name);
				this.onChange(this.state);
				this.performTask();
			}
		},
		extend:function(options){
			var parent = Task.prototype
			var child = {};
			for (var prop in parent) child[prop] = parent[prop];
			for (var prop in options) child[prop] = options[prop];
		    return child;
		}
	};
	
	// task group
	var TaskGroup = {
		prototype:{
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
		},
		extend:function(options){
			var parent = Task.extend(TaskGroup.prototype);
			var child = {};
			for (var prop in parent) child[prop] = parent[prop];
			for (var prop in options) child[prop] = options[prop];
		    return child;
		}
	};

	// parallel task
	var ParallelTask = {
		prototype:{
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
		},
		extend:function(options){
			var parent = TaskGroup.extend(ParallelTask.prototype);
			var child = {};
			for (var prop in parent) child[prop] = parent[prop];
			if(!options) options = {};
			options.tasks = createSubTasksFromTaskOptionsArray(options.tasks);
			for (var prop in options) child[prop] = options[prop];
		    return child;
		}
	};

	// sequence task
	var SequenceTask = {
		prototype:{
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
		},
		extend:function(options){
			var parent = TaskGroup.extend(SequenceTask.prototype);
			var child = {};
			for (var prop in parent) child[prop] = parent[prop];
			if(!options) options = {};
			options.tasks = createSubTasksFromTaskOptionsArray(options.tasks);
			for (var prop in options) child[prop] = options[prop];
		    return child;
		}
	};

	this.MonkeyBars = {
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
		Task:Task,
		ParallelTask:ParallelTask,
		SequenceTask:SequenceTask
	};

}(this));