define(["monkeybars"], function(MonkeyBars) {

	'use strict';

	return MonkeyBars.Task.extend({
		name: "task2",
		performTask: function() {
			this.complete(this.displayName);
		}
	});

});