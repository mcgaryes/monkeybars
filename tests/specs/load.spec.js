/*jshint loopfunc:true */
/*global describe:false, it:false, afterEach:false, beforeEach:false, MonkeyBars:false */
"use strict";


describe("library", function() {
	
	it("parallel task can handle load", function() {
		
		var tasks = [];
		for(var i = 0; i < 10000; i++) {
			var task = new MonkeyBars.Task({
				name: "sub-" + i,
				performTask: function() {
					this.complete();
				}
			});
			tasks.push(task);
		}

		var group = new MonkeyBars.ParallelTask({
			tasks:tasks
		});

		group.start();
		
		waitsFor(function() {
			return group.state > MonkeyBars.TaskStates.Started;
		}, "the task to complete", 20000);

		runs(function() {
			expect(group.state).toEqual(MonkeyBars.TaskStates.Completed);
		});
		

	});

	it("sequence task can handle load", function() {
		return;
		var tasks = [];
		for(var i = 0; i < 2000; i++) {
			var task = new MonkeyBars.Task({
				name: "sub-" + i,
				performTask: function() {
					this.complete();
				}
			});
			tasks.push(task);
		}

		var group = new MonkeyBars.SequenceTask({
			tasks:tasks
		});

		group.start();
		
		waitsFor(function() {
			return group.state > MonkeyBars.TaskStates.Started;
		}, "the task to complete", 20000);

		runs(function() {
			expect(group.state).toEqual(MonkeyBars.TaskStates.Completed);
		});

	});
	//*/


});