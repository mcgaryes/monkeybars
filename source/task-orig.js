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
			TaskTypeGroup:"TaskGroup",
			TaskTypeSequence:"SequenceTask",
			TaskTypeParallel:"ParallelTask"
		},
		
		/**
		 * Task
		 */
		Task:function(){
								
		    var name = TaskLibrary.TaskTypes.TaskTypeTask;
		    var type = TaskLibrary.TaskTypes.TaskTypeTask;
			var state = TaskLibrary.TaskStates.TaskStateInitialized;
			var constructor = function(){};
			var methods = {
				
				/**
				 * Kicks off the task execution
				 */
				start:function(){
					if(this.state >= TaskLibrary.TaskStates.TaskStateStarted) return;
					this.state = TaskLibrary.TaskStates.TaskStateStarted;
					TaskLibrary.log("Started:" + this.name);
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
					TaskLibrary.log("Canceled:" + this.name);
					if(this.block) this.block(this,this.state,null);
				},

				/**
				 * Called from subclass when the task is complete
				 */
				complete:function(){
					if(this.state > TaskLibrary.TaskStates.TaskStateStarted) return;
					this.state = TaskLibrary.TaskStates.TaskStateCompleted;
					TaskLibrary.log("Completed:" + this.name);
					if(this.block) this.block(this,this.state,null);
					// this is where ill need to have some events fired off
				},

				/**
				 * to be called if the subtask fails in any way
				 */
				fault:function(error){
					if(this.state >= TaskLibrary.TaskStates.TaskStateCanceled) return;
					this.state = TaskLibrary.TaskStates.TaskStateFaulted;
					TaskLibrary.log("Faulted:" + this.name);
					if(this.block) this.block(this,this.state,error);
				}

			};
			
			// create our task object
			var proto = new Object();
			
			// reset the proto
			for(var p in proto) if (proto.hasOwnProperty(p)) delete proto[p];
			
		    // setup super and name
			proto.constructor = constructor;
			proto.name = name;
			proto.type = type;
			proto.state = state;
			
			// Copy instance methods to the prototype object
			for(var p in methods) proto[p] = methods[p];

			// set the prototype for the object (task) we're about to return
			constructor.prototype = proto;

		    // Finally, return the constructor function
		    return constructor;
			
		},
		
		/**
		 * TaskGroup
		 */
		TaskGroup:function(){
			return TaskLibrary.Task();
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
 		},
		
		/**
		 *
		 */
		log:function(message){
			 if(console && console.log){
	 			console.log(message);
			 }
		 }
	
	};

	//TaskLibrary.Task.extend = _.extend;
	
	// TaskLibrary.Task.extend = TaskLibrary.TaskGroup.extend = function(options){
	// 		var child = this;
	// 		//for(var option in options) {
	// 		//	child[option] = options[option];
	// 		//}
	// 		return child;
	// 	};
	
	return TaskLibrary;
	
})();