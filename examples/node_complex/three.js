"use strict";

var MonkeyBars = require("../../monkeybars");

exports.Three = MonkeyBars.Task.extend({
	name:"Three",
	performTask:function(){
		this.complete();
	}
});