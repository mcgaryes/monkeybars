(function() { 

	Task = {

		extend:function(options){

			if(!options)
			{
				throw "No options passed";
				return;
			}

			var type = options.type;
			var tasks = options.tasks;

			if(type) {
				if(type == "simple" && (type == "sequence" || type == "parallel")) {
					return new Task.__SimpleTask__(options);
				} else {
					return new Task.__TaskGroup__(options);
				}
			} else {
				if (!tasks) {
					return new Task.__SimpleTask__(options);
				} else {
					if(tasks.length == 0) {
						return new Task.__SimpleTask__(options);
					} else {
						return new Task.__TaskGroup__(options);
					}
				}
			}

		},

		States:{
			Initialized:0,
			Started:1,
			Canceled:2,
			Faulted:3,
			Completed:4
		},

		__SimpleTask__:function(options){

			// setup defaults
			var name = options.name ? options.name : "SimpleTask";
			var state = Task.States.Initialized;
			var type = options.type ? options.type : "simple";
			var constructor = function(){};
			var methods = {
				start:function(){
					if(this.state >= Task.States.Started) return;
					this.state = Task.States.Started;
					if(this.logging) console.log("Started:" + this.name);
					this.change(this.state);
					this.perform();
				},
				perform:function(){
					throw "'perform' method should be overridden";
				},
				operate:function(operator){
					if(this.logging) console.log("operate with - " + operator);
					this.product = operator;
				},
				cancel:function(){
					if(this.state > Task.States.Started) return;
					this.state = Task.States.Canceled;
					if(this.logging) console.log("Canceled:" + this.name);
					this.change(this.state);
				},
				complete:function(){
					if(this.state > Task.States.Started) return;
					this.state = Task.States.Completed;
					if(this.logging) console.log("Completed:" + this.name);
					this.change(this.state);
				},
				fault:function(error){
					if(this.state >= Task.States.Canceled) return;
					this.state = Task.States.Faulted;
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

		},

		__TaskGroup__:function(options){

			var type = options.type ? options.type : "sequence";
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
					throw "task group method 'processSubTask' is not yet implemented";
				},
				onSubTaskComplete:function(){
					throw "task group method 'onSubTaskComplete' is not yet implemented";
				},
				onSubTaskFault:function(error){
					throw "task group method 'onSubTaskFault' is not yet implemented";
				},
				onSubTaskCancel:function(task){
					throw "task group method 'onSubTaskCancel' is not yet implemented";
				},
				perform:function(){						 
					throw "task group method 'perform' is not yet implemented";
				}
				 
			};

			// mixin methods from the options and those listed above
			for(var p in methods) options[p] = methods[p];

			// create tasks for each subtask listed in the array
			for(var i=0;i<options.tasks.length;i++){
				var opts = options.tasks[i];
				var task = Task.extend(opts);
				tasks.push(task);
			}
			options.tasks = tasks;

			// instatiate the correct type of task
			if(type == "sequence") {
				return new Task.__SequenceTask__(options);
			} else {
				return new Task.__ParallelTask__(options);
			}

		},

		__ParallelTask__:function(){
			options.type = "parallel";
			return new Task.__SimpleTask__(options);
		},

		__SequenceTask__:function(options){
			options.type = "sequence";
			return new Task.__SimpleTask__(options);
		}

	};

	return Task;

})();