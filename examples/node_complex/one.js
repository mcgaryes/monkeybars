"use strict";

var MonkeyBars = require("../../monkeybars");

exports.One = MonkeyBars.Task.extend({
	name:"One",
	concurrent:true,
	performTask:function(a) {
		var newData = 100;
		this.complete(newData);
	}
});