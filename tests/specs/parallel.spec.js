describe("Parallel Tests", function() {

	beforeEach(function() {});
	afterEach(function() {});

	it("Initializing parallel task",function(){
		var task = MonkeyBars.ParallelTask.extend({
			name:"name",
			tasks:[{
				name:"subtask",
				perform:function(){
					this.complete();
				}
			}],
			performTask:function(){
				this.complete();
			}
		});

		expect(task.type).toEqual("parallel");
		expect(task.name).toEqual("name");
		expect(task.state).toEqual(0);
		task.start();
		expect(task.state).toEqual(4);
	});

});