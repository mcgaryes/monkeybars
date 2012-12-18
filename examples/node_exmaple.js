var MonkeyBars = require("../source/monkeybars");

var task = new MonkeyBars.Task({
	performTask:function(){
		this.complete();
	}
});

task.start();