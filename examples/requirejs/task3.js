define(["monkeybars"], function(MonkeyBars) {

	'use strict';

	return MonkeyBars.Task.extend({
		name: "task3",
		performTask: function() {
			this.complete(this.displayName);
		}
	});

});