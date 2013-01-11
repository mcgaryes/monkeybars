"use strict";

var MonkeyBars = require("../../monkeybars");

var task = new MonkeyBars.Task({
	logLevel:MonkeyBars.LogLevels.Verbose,
	performTask:function(){
		this.complete();
	}
});

task.start();