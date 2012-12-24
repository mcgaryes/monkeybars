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

		it("Group Completes After All Subtasks Are Complete",function(){

			var subTaskComplete;
			var groupTaskComplete;

			var CustomTask = MonkeyBars.Task.extend({
				performTask:function(){
					this.complete();
				}
			});

			var t1 = new CustomTask();
			var t2 = new CustomTask();
			var t3 = new CustomTask({
				performTask:function(){
					subTaskComplete = new Date().getTime();
					this.complete();
				}
			});

			var group = new MonkeyBars.ParallelTask({
				tasks:[t1,t2,t3],
				onComplete:function(){
					groupTaskComplete = new Date().getTime();
				}
			});

			group.start();

			runs(function() {
				setTimeout(function(){
					expect(subTaskComplete).toBeLessThan(groupTaskComplete);
      			},100);
    		});

		});

		it("Can Only Run MAX Amount Simultaniously",function(){

			var tasks = [];

			for (var i = 0; i < 20; i++) {
				tasks.push(new MonkeyBars.Task({
					name:"task" + i,
					performTask:function(){
						var delegate = this;
						setTimeout(function(){
							delegate.complete();
						},10);	
					}
				}));
			};

			var group = new MonkeyBars.ParallelTask({
				max:3,
				tasks:tasks,
				onComplete:function(){
					groupTaskComplete = new Date().getTime();
				}
			});

			group.start();
			expect(group.processedIndex).toEqual(3);

			runs(function() {
				setTimeout(function(){
					expect(group.state).toEqual(4);
      			},300);
    		});

		});

		it("Sub Tasks Should Only Run Once Their Dependencies Have",function(){

			var t1 = new MonkeyBars.Task({
				name:"t1",
				performTask:function(){}
			});

			var t2 = new MonkeyBars.Task({
				name:"t2",
				dependencies:[t1],
				performTask:function(){ this.complete(); }
			});

			var t3 = new MonkeyBars.Task({
				name:"t3",
				dependencies:[t2],
				performTask:function(){ this.complete(); }
			});

			var group = new MonkeyBars.ParallelTask({
				tasks:[t1,t2,t3]
			});

			group.start();

			expect(t2.state).not.toEqual(MonkeyBars.TaskStates.Completed);
			expect(t3.state).not.toEqual(MonkeyBars.TaskStates.Completed);

			t1.complete();
			
			expect(t2.state).toEqual(MonkeyBars.TaskStates.Completed);
			expect(t3.state).toEqual(MonkeyBars.TaskStates.Completed);
			expect(group.state).toEqual(MonkeyBars.TaskStates.Completed);

		});

	});

	// ===================================================================
	// === Decorator Tests ===============================================
	// ===================================================================

	describe("Decorator Tests", function() {

		var value, flag;

		beforeEach(function() {});

		afterEach(function() {
			value = undefined;
			flag = undefined;
		});

		it("FOR",function(){
			var index = 0;
			var task = new MonkeyBars.ParallelTask({
				count:3,
				tasks:[{
					performTask:function(){
						index++;
						this.complete();
					}
				},
				{
					performTask:function(){
						index+=2;
						this.complete();
					}
				}]
			});
			task.start();
			expect(index).toEqual(9);
		});

	});

});