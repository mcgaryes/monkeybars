describe("Load Tests", function() {
	var group;

	beforeEach(function() {
		
		var tasks = [];
		for(var i = 0;i<100;i++) {
			tasks.push({
				name:"sub-" + i,
				performTask:function(){
					var delegate = this;
					// if i dont use this settimeout the shear force of instantiating
					// over 2000 tasks is causing the call stack to max out
					setTimeout(function(){
						delegate.complete(); 
					},10);
				}
			});
		}
		//group.tasks = tasks;
		group = new MonkeyBars.ParallelTask({
			tasks:tasks,
			onComplete:function(){
				this.destroy();
			}
		});
	});

	afterEach(function() {
		group = null;
		group = undefined;
	});

	it("does handle load",function(){
		group.start();
		console.log(group);
	});


});