describe("Load Tests", function() {
	var group;

	beforeEach(function() {
		var tasks = [];
		for(var i = 0;i<10000;i++) {
			tasks.push({
				name:"sub-" + i,
				performTask:function(){
					var delegate = this;
					// if i dont use this settimeout the shear force of instantiating
					// over 2000 tasks is causing the call stack to max out
					setTimeout(function(){
						delegate.complete(); 
					},1);
				}
			});
		}
		group = new MonkeyBars.ParallelTask({tasks:tasks});
		// group = new MonkeyBars.SequenceTask({tasks:tasks});
	});

	afterEach(function() {
		group = null;
		group = undefined;
	});

	it("does handle load",function(){
		group.start();
		waitsFor(function() {
			return group.state > MonkeyBars.TaskStates.Started;
		}, "the task to complete", 20000);

		runs(function() {
			expect(group.state).toEqual(MonkeyBars.TaskStates.Completed);
		});
	});


});