/**
@module TaskLibrary
*/
var TaskLibrary = (function() {

	/**
	 * description
	 * @property states {Object} description
	 */
	var states = {
		Initialized:0,
		Started:1,
		Canceled:2,
		Faulted:3,
		Completed:4
	};

	/**
	 * description
	 * @property types {Object} description
	 */
	var types = {
		Parallel:"parallel",
		Sequence:"sequence",
		Simple:"simple"
	};

	/**
	 * description
	 *
	 * @method create 
	 * @return 
	 */
	var create = function(options){

		if(!options)
		{
			throw "No options passed";
			return;
		}

		var type = options.type;
		var tasks = options.tasks;

		if(type) {
			if(type == types.Simple) {
				return new Task(options);
			} else {
				return new TaskGroup(options);
			}
		} else {
			if (!tasks) {
				return new Task(options);
			} else {
				return new TaskGroup(options);
			}
		}

	};

	/**
	 * description
	 *
	 * @method Task 
	 * @return 
	 */
	var Task = function(options){
		// setup defaults
		var name = options ? (options.name ? options.name : "Task") : "Task";
		var state = states.Initialized;
		var type = options ? (options.type ? options.type : types.Simple) : types.Simple;
		var logging = options ? (options.logging ? options.logging : false) : false;
		var constructor = function(){};
		var methods = {
			start:function(){
				if(this.state >= states.Started) return;
				this.state = states.Started;
				if(this.logging) console.log("Started:" + this.name);
				this.change(this.state);
				this.perform();
			},
			perform:function(){
				throw "'perform' method should be overridden";
			},
			cancel:function(){
				if(this.state > states.Started) return;
				this.state = states.Canceled;
				if(this.logging) console.log("Canceled:" + this.name);
				this.change(this.state);
			},
			complete:function(){
				if(this.state > states.Started) return;
				this.state = states.Completed;
				if(this.logging) console.log("Completed:" + this.name);
				this.change(this.state);
			},
			fault:function(error){
				if(this.state >= states.Canceled) return;
				this.state = states.Faulted;
				if(this.logging) console.log("Faulted:" + this.name);
				this.change(this.state,error);
			},
			change:function(state,error){}
		}

		// create our task object
		var proto = new Object();
		
		// reset the proto
		for(var p in proto) if (proto.hasOwnProperty(p)) delete proto[p];
		
	    // setup super and name
		proto.constructor = constructor;
		proto.name = name;
		proto.type = type;
		proto.state = state;
		proto.logging = logging;
		
		// add mixins (e.g. performTask method and name)
		for(var prop in options) {
			if(typeof options[prop] == "function" && methods[prop] !== undefined){
				methods[prop] = options[prop];
			}else{
				proto[prop] = options[prop];
			}
		}

		// Copy instance methods to the prototype object
		for(var p in methods) proto[p] = methods[p];

		// set the prototype for the object (task) we're about to return
		constructor.prototype = proto;

	    // Finally, return the constructor function
	    return proto;

	}
	
	/**
	 * description
	 *
	 * @private
	 * @method TaskGroup 
	 * @return 
	 */
	var TaskGroup = function(options){
		var type = options.type ? options.type : types.Sequence;
		var tasks = [];
		var methods = {
			addSubTask:function(task){
				throw "task group method 'addSubTask' is not yet implemented";
			},
			addSubTaskAfterTask:function(beforeTask,afterTask){
				throw "task group method 'addSubTaskAfterTask' is not yet implemented";
			},
			removeSubTask:function(task){
				throw "task group method 'removeSubTask' is not yet implemented";
			},
			processSubTask:function(task){
				
				if (!task) throw "You cannot process a task with a nil value.";
				
				if(task.state == states.Canceled)
				{
					// We are running the sub task canceled functionality here
					// because there is a chance that the task being about to run
					// was dependent on a task that was previously canceled in the queue
					// and we need to make sure that it notifies any tasks that may
					// be dependent on itself that they also should be canceled
					//console.log(@"\t--\tRSRCTask:    Skipped:\t%@",task.name);
					this.onSubTaskCancel(task);
					return true;
				}
				
				// set concurrency for the sub tasks
				//task.concurrent = self.concurrent;
				task.group = this;
				
				// set execution block
				task.change = function(state,error){
					if(state == states.Completed) this.group.onSubTaskComplete();
					else if(state == states.Faulted) this.group.onSubTaskFault(error);
					else if(state == states.Canceled) this.group.onSubTaskCancel(task);
				}
				
				task.start();
				
				return false;
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
			perform:function(){						 
				throw "This is an abstract method and must be implemented in a subclass.";
			}
		};

		// mixin methods from the options and those listed above
		for(var p in methods) options[p] = methods[p];

		// create tasks for each subtask listed in the array
		for(var i=0;i<options.tasks.length;i++){
			var opts = options.tasks[i];
			// apply any options that we want to be transfered from the group
			// to the sub tasks (e.g. concurrency, logging)
			opts.logging = options.logging;
			var task = create(opts);
			tasks.push(task);
		}
		options.tasks = tasks;

		// instatiate the correct type of task
		if(type == types.Sequence) {
			return new SequenceTask(options);
		} else {
			return new ParallelTask(options);
		}
	};

	/**
	 * description
	 *
	 * @method ParallelTask 
	 * @return 
	 */
	var ParallelTask = function(options) {
		
		options.type = types.Parallel;
		options.currentIndex = 0;

		var methods = {
			perform:function(){
				if (this.hasNoEnabledSubTasks()){
					this.complete();
				}else{
					this.processSubTasks();
				}
			},
			hasNoEnabledSubTasks:function(){
				for (var i = 0; i < this.tasks.length; i++) {
					var task = this.tasks[i];
					if(task.state != states.Canceled) return false;
				};
				return true;
			},
			processSubTasks:function(){
				for (var i = 0; i < this.tasks.length; i++) {
					var task = this.tasks[i];
					this.currentIndex++;
					this.processSubTask(task);
				};
			},
			addSubTask:function(task) {
				throw "Not yet implemented";
				/*
				if (!task || task.state == RSRCTaskStateCanceled) return;
				this.currentIndex++;
				[self.tasks addObject:task];
				[self processSubTask:task];
				*/
			},
			onSubTaskComplete:function(){
				if(this.currentIndex-- <= 1) this.complete();
			}
		};
		
		// mixin methods from the options and those listed above
		for(var p in methods) options[p] = methods[p];
		
		// create a new task based off of the manipulated options
		return new Task(options);

	};

	/**
	 * description
	 *
	 * @method SequenceTask 
	 * @return 
	 */
	var SequenceTask = function(options){
		
		options.type = types.Sequence;
		options.currentIndex = 0;

		var methods = {
			 
			perform:function(){
				this.startNextSubTask();
			},

			startNextSubTask:function(){
				if(this.state >= states.Canceled) return;
				if (this.tasks && this.currentIndex < this.tasks.length){
					var skipped = this.processSubTask(this.tasks[this.currentIndex++]);
					if (skipped) this.startNextSubTask();
				}else{
					this.complete();
				}
			},

			onSubTaskComplete:function(){
				if(this.state == states.Canceled) return;
				this.startNextSubTask();
			},

			onSubTaskCancel:function(task){
				//[super onSubTaskCancel:task];
				if(this.state != states.Canceled) this.startNextSubTask();
			}
		};

		// mixin methods from the options and those listed above
		for(var p in methods) options[p] = methods[p];

		// create a new task based off of the manipulated options
		return new Task(options);
	};

	return {

		// propertiess
		TaskStates:states,
		TaskTypes:types,

		// methods
		create:create,
		Task:Task,
		SequenceTask:function(options) {
			if(!options) options = {};
			options.type = types.Sequence;
			options.tasks = options.tasks ? options.tasks : [];
			return new TaskGroup(options);
		},
		ParallelTask:function(options) {
			if(!options) options = {};
			options.type = types.Parallel;
			options.tasks = options.tasks ? options.tasks : [];
			return new TaskGroup(options);
		}

	};

}());