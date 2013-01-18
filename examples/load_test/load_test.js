var MonkeyBars = require("../../monkeybars.js");

var CustomTask = MonkeyBars.Task.extend({
	performTask:function(){
		this.complete();
	}
});

var group = new MonkeyBars.ParallelTask({
	logLevel:1000
});

var tasks = [];
for(var i=0; i < 3000; i++) {
	tasks.push(new CustomTask({ name:("task - " + i) }));
}
group.tasks = tasks;

group.start();