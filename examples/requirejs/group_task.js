define(["monkeybars", "task1", "task2", "task3"], function(
MonkeyBars, Task1, Task2, Task3) {

	'use strict';

	var t1 = new Task1();
	var t2 = new Task2();
	var t3 = new Task3();

	return MonkeyBars.ParallelTask.extend({
		name: "group",
		tasks: [t1, t2, t3],
		operate: function(data) {
			if(this.data === undefined) {
				this.data = [];
			}
			this.data.push(data);
		}
	});

});