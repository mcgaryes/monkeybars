(function() { 

	TaskLibrary = {
		
		/**
		 * Task States
		 */
		TaskStates:{
			TaskStateInitialized:0,
			TaskStateStarted:1,
			TaskStateCanceled:2,
			TaskStateFaulted:3,
			TaskStateCompletedd:4
		},
		
		/**
		 * Task Types
		 */
		TaskTypes:{
			TaskTypeTask:"Task",
			TaskTypeGroup:"Group",
			TaskTypeSequence:"Sequence",
			TaskTypeParallel:"Parallel"
		}
		
		/**
		 * Task
		 */
		Task:{
			
			// @TODO: Have Task return a constructor and create a global function to 
			// TaskLibrary called extend that will make it easier to extend prototypes
			// for subclasses of Task
			
			extend:function(options){
								
				// create the task proto
			    var name = "Task";
			    var type = "Task";
				var superClass = Object;
				var state = TaskLibrary.TaskStates.TaskStateInitialized;
				var states = TaskLibrary.TaskStates;
				var task = function(){};
				var methods = {
				
					/**
					 * Kicks off the task execution
					 */
					start:function(){
						if(this.state >= TaskLibrary.TaskStates.TaskStateStarted) return;
						this.state = TaskLibrary.TaskStates.TaskStateStarted;
						console.log("Started:" + this.name);
						if(this.block) this.block(this,this.state,null);
						this.performTask();
					},
					
					/*
					 *
					 */
					performTask:function(){
						throw "This is an abstract method and must be implemented in a subclass.";
					},

					/**
					 * sets the tasks canceled status
					 */
					cancel:function(){
						if(this.state > TaskLibrary.TaskStates.TaskStateStarted) return;
						this.state = TaskLibrary.TaskStates.TaskStateCanceled;
						console.log("Canceled:" + this.name);
						if(this.block) this.block(this,this.state,null);
					},

					/**
					 * Called from subclass when the task is complete
					 */
					complete:function(){
						if(this.state > TaskLibrary.TaskStates.TaskStateStarted) return;
						this.state = TaskLibrary.TaskStates.TaskStateCompleted;
						console.log("Completed:" + this.name);
						if(this.block) this.block(this,this.state,null);
						// this is where ill need to have some events fired off
					},

					/**
					 * to be called if the subtask fails in any way
					 */
					fault:function(error){
						if(this.state >= TaskLibrary.TaskStates.TaskStateCanceled) return;
						this.state = TaskLibrary.TaskStates.TaskStateFaulted;
						console.log("Faulted:" + this.name);
						if(this.block) this.block(this,this.state,error);
					}

				};
			
				// create our task object
				var proto = new superClass();
			
				// reset the proto
				for(var p in proto) if (proto.hasOwnProperty(p)) delete proto[p];
			
			    // setup super and name
				proto.task = task;
			    proto.superClass = superClass;
				proto.name = name;
				proto.type = type;
				proto.state = state;
				
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

				task.prototype = proto;

			    // Finally, return the constructor function
			    return task;
				
			},
			
		},
		
		/**
		 * TaskGroup
		 */
		TaskGroup:{
			
			extend:function(options){

				var type = "TaskGroup";
				var methods = {
				
					/**
					 * Adds a sub task to the tasks array
					 */
					addSubTask:function(task){
						throw "TaskGroup Method 'addSubTask' is not yet implemented";
					},

					/**
					 * Adds a sub task to the tasks array after a specified task
					 */
					addSubTaskAfterTask:function(beforeTask,afterTask){
						throw "TaskGroup Method 'addSubTaskAfterTask' is not yet implemented";
					},

					/**
					 * Removes a sub task from the tasks array
					 */
					removeSubTask:function(task){
						throw "TaskGroup Method 'removeSubTask' is not yet implemented";
					},

					/**
					 * Processing for a sub task that sets completion blocks as well as starts the sub task
					 */
					processSubTask:function(task){
						throw "TaskGroup Method 'processSubTask' is not yet implemented";
					},

					/**
					 * Functionality to be performed on a sub tasks completion. This method should be ovverriden in the concrete implementation.
					 */
					onSubTaskComplete:function(){
						throw "TaskGroup Method 'onSubTaskComplete' is not yet implemented";
					},

					/**
					 * Functionality to be performed on a sub tasks fault. This method should be ovverriden in the concrete implementation.
					 */
					onSubTaskFault:function(error){
						throw "TaskGroup Method 'onSubTaskFault' is not yet implemented";
					},
				
					/**
					 * Functionality to be performed when a sub task is canceled
					 */
					onSubTaskCancel:function(task){
						throw "TaskGroup Method 'onSubTaskCancel' is not yet implemented";
					},
					
					/**
					 * Overriding performTask here
					 */
					 performTask:function(){						 
 						throw "TaskGroup Method 'performTask' is not yet implemented";
					 }
					 
				};
				
				// apply vars to options
				options.type = type;
				for(var method in methods) options[method] = methods[method];
				
				var taskgroup = TaskLibrary.Task.extend(options);
				return taskgroup;
			   	
			}
			
		},
		
		/**
		 * SequenceTask
		 */
 		SequenceTask: {
			/* ... */
		},
		
 		/**
 		 * ParallelTask
 		 */
  		ParallelTask: {
			/* ... */
 		}
	
	};
	
	// @TODO: write a simple abstaction of the extend functionalty right here
	// @TODO: write a logging function that checks for console... before it assumes that there is one
	
	TaskLibrary.Task.run = run;
	return TaskLibrary;
	
})();