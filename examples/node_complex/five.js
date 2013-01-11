"use strict";

var MonkeyBars = require("../../monkeybars");

exports.Five = MonkeyBars.Task.extend({
	name:"Five",
	performTask:function(){
		this.complete();
	}
});