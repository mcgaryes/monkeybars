"use strict";

var MonkeyBars = require("../../monkeybars");

exports.One = MonkeyBars.Task.extend({
	name:"One",
	performTask:function(a) {
		var newData = 100;
		this.complete(newData);
	}
});
