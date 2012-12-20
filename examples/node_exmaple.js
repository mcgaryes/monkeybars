var MonkeyBars = require("../monkeybars");

var task = new MonkeyBars.Task({
	loggingEnabled:true,
	performTask:function(){
		this.complete();
	}
});

task.start();