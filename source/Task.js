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
				if(type == "simple") {
					return new Task.__SimpleTask__(options);
				} else if (type == "sequence") {
					//console.log("SEQUENCE");
				} else if (type == "parallel") {
					//console.log("PARALLEL");
				} else {
					return new Task.__SimpleTask__(options);
				}
			} else {
				if (!tasks) {
					return new Task.__SimpleTask__(options);
				} else {
					if(tasks.length == 0) {
						return new Task.__SimpleTask__(options);
					} else {
						//console.log("SEQUENCE");
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
			var type = "simple";
			var constructor = function(){};
			var methods = {
				start:function(){
					if(this.state >= Task.States.Started) return;
					this.state = Task.States.Started;
					console.log("Started:" + this.name);
					this.change(this.state);
					this.perform();
				},
				perform:function(){
					throw "'perform' method should be overridden";
				},
				operate:function(operator){
					console.log("operate with - " + operator);
					this.product = operator;
				},
				cancel:function(){
					if(this.state > Task.States.Started) return;
					this.state = Task.__TaskStates__.Canceled;
					console.log("Canceled:" + this.name);
					this.change(this.state);
				},
				complete:function(){
					if(this.state > Task.States.Started) return;
					this.state = Task.States.Completed;
					console.log("Completed:" + this.name);
					this.change(this.state);
				},
				fault:function(error){
					if(this.state >= Task.States.Canceled) return;
					this.state = Task.States.Faulted;
					console.log("Faulted:" + this.name);
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

		__TaskGroup__:function(){

		},

		__ParallelTask__:function(){

		},

		__SequenceTask__:function(){

		}

	};

	return Task;

})();