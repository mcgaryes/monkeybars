describe("Parallel Task Tests", function() {

	// ===================================================================
	// === Initialization Tests ==========================================
	// ===================================================================

	describe("Initialization Tests", function() {

		it("Initialization",function(){
			var task = new MonkeyBars.ParallelTask({ name:"name" });
			expect(task.type).toEqual("parallel");
			expect(task.name).toEqual("name");
			expect(task.state).toEqual(0);
		});

	});

	// ===================================================================
	// === Execution Tests ===============================================
	// ===================================================================

	describe("Execution Tests", function() {

		it("Execution With No Subtasks",function(){
			var task = new MonkeyBars.ParallelTask();
			task.start();
			expect(task.state).toEqual(4);
		});

		it("Execution With Subtasks",function(){
			var task = new MonkeyBars.ParallelTask({
				tasks:[{
					performTask:function(){
						this.complete();
					}
				}]
			});
			task.start();
			expect(task.tasks.length).toEqual(1);
			expect(task.state).toEqual(4);
		});

	});

});