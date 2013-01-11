"use strict";

var MonkeyBars = require("../../monkeybars");

exports.Four = MonkeyBars.Task.extend({
	name:"Four",
	performTask:function(){
		var newData = this.data * 4;
		this.complete(newData);
	}
});