describe("Parallel Task Tests", function() {

	// ===================================================================
	// === Initialization Tests ==========================================
	// ===================================================================

	describe("Initialization Tests", function() {

		it("Initialization With Type",function(){
			var task = MonkeyBars.create({
				name:"name",
				type:"parallel",
				tasks:[{
					name:"subtask",
					performTask:function(){
						this.complete();
					}
				}]
			});
			expect(task.type).toEqual("parallel");
			expect(task.name).toEqual("name");
			expect(task.state).toEqual(0);
		});

		it("Initialization Without Type",function(){
			var task = MonkeyBars.create({
				name:"name",
				type:"parallel",
				tasks:[{
					name:"subtask",
					performTask:function(){
						this.complete();
					}
				}]
			});
			expect(task.type).toEqual("parallel");
			expect(task.name).toEqual("name");
			expect(task.state).toEqual(0);
		});

/*

		it("Initialization as expected",function(){
			var task = new MonkeyBars.ParallelTask({
				name:"name",
				tasks:[{
					name:"subtask",
					performTask:function(){
						this.complete();
					}
				}]
			});

			expect(task.type).toEqual("parallel");
			expect(task.name).toEqual("name");
			expect(task.state).toEqual(0);
			task.start();
			expect(task.state).toEqual(4);
		});

		it("Subtasks do not get recreated",function(){
			var index = 0;
			var simple = new MonkeyBars.Task({
				name:"precreated",
				count:4,
				performTask:function(){
					index++;
					this.complete();
				}
			});
			var tid = simple.tid;
			var task = new MonkeyBars.ParallelTask({
				name:"name",
				tasks:[{
					name:"subtask",
					performTask:function(){
						index++;
						this.complete();
					}
				},
				simple]
			});
			task.start();
			expect(task.getTaskById(simple.tid).tid).toEqual(tid);
			expect(index).toEqual(5);
			expect(task.state).toEqual(4);
		});

*/

	});
/*
	// ===================================================================
	// === Decorator Tests ===============================================
	// ===================================================================

	describe("Decorator Tests", function() {

		it("FOR decorator performs as expected",function(){
			var index = 0;
			var task = new MonkeyBars.ParallelTask({
				count:3,
				loggingEnabled:false,
				tasks:[{
					name:"subtask1",
					performTask:function(){
						index++;
						this.complete();
					}
				},
				{
					name:"subtask2",
					performTask:function(){
						index++;
						this.complete();
					}
				},
				{
					name:"subtask2",
					performTask:function(){
						index++;
						this.complete();
					}
				}]
			});
			task.start();
			expect(index).toEqual(9);
		});

	});

	// ===================================================================
	// === Structural Tests ==============================================
	// ===================================================================

	describe("Structural Tests", function() {

	});

	// ===================================================================
	// === Excecution Tests ==============================================
	// ===================================================================

	describe("Execution Tests", function() {

		it("Task doesnt complete if sub tasks dont complete",function(){

			

			var task = new MonkeyBars.ParallelTask({
				tasks:[]
			})

		});

	});
*/
});