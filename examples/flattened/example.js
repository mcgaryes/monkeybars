var MonkeyBars = require("../../monkeybars");

var globalObject = {};

var CustomTask = MonkeyBars.Task.extend({
	performTask:function(){
		globalObject[this.displayName] = this.displayName;
		this.complete();
	}
});

var CustomParallelTask = MonkeyBars.ParallelTask.extend({
	name:"parallel-sub",
	initialize:function(options){
		for (var i = 0; i < options.total; i++) {
			var customTask = new CustomTask();
			this.addSubTask(customTask);
		};
	}
})

var sequence = new MonkeyBars.SequenceTask({ 
	name:"sequence",
	logLevel:1000,
	tasks:[{
		name:"initial",
		performTask:function(){

			// make ajax and figure out total
			var total = 10;
			// create our parallel task and instantiate it with data that we pulled
			// from the previous ajax call... this contrived example just passes a total
			var parallel = new CustomParallelTask({ total:total });
			this.group.addSubTaskAfterTask(parallel,this);

			// call complete on this task
			this.complete();
		}
	},{
		name:"final",
		performTask:function(){
			this.complete();
		}
	}],
	onComplete:function(){
		// trace out the global object we've been manipulating
		console.log(globalObject);
	}
});

sequence.start();