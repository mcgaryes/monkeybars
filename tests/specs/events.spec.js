describe("task events", function() {

	it("are present", function() {
		var task = new MonkeyBars.Task();
		expect(task.on).toBeDefined();
	});

	it("using 'on' register event",function(){
		var task = new MonkeyBars.Task();
		task.on("wildevent",null);
		expect(task._eventMap.wildevent).toBeDefined();
	});

	it("regeristing 'on' calls registered callback",function(){
		var flag = false;
		var task = new MonkeyBars.Task({
			performTask:function(){
				this.complete();
			}
		});
		task.on("complete",function(){
			flag = true;
		});
		task.start();
		expect(flag).toBeTruthy();
	});

	it("using 'off' with function reference unregisters event",function(){
		var task = new MonkeyBars.Task();
		var test = function(){};
		task.on("wildevent",test);
		task.off("wildevent",test);
		expect(task._eventMap.wildevent.length).toEqual(0);
	});

	it("with 'configurable' set to false do not get removed",function(){
		var task = new MonkeyBars.Task();
		var test = function(){};
		task.on("wildevent",test,this,false);
		task.off("wildevent");
		expect(task._eventMap.wildevent.length).toEqual(1);
	});

});