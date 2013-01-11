"use strict";

var MonkeyBars = require("../../monkeybars");

exports.Six = MonkeyBars.Task.extend({
	name:"Six",
	performTask:function(){
		this.complete();
	}
});