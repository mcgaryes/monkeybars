describe("parallel", function() {

	// ===================================================================
	// === Initialization Tests ==========================================
	// ===================================================================
	
	describe("task initialization", function() {

		it("initializes", function() {
			var task = new MonkeyBars.ParallelTask({
				name: "name"
			});
			expect(task.type).toEqual("parallel");
			expect(task.name).toEqual("name");
			expect(task.state).toEqual(0);
		});

	});

	// ===================================================================
	// === Task Injection Tests ==========================================
	// ===================================================================
	
	describe("task injection", function() {

		it("works", function() {

			var group = new MonkeyBars.ParallelTask({
				name: "name",
				tasks: [{
					name: "task"
				}]
			});

			var parallel = new MonkeyBars.ParallelTask({
				name: "parallel"
			});

			group.addSubTask(parallel);
			expect(group.tasks[1].name).toEqual("parallel");
			expect(group.getTaskByName("parallel")).toBeDefined();
			expect(group.tasks.length).toEqual(2);

		});

	});

	// ===================================================================
	// === Execution Tests ===============================================
	// ===================================================================
	
	describe("task executes", function() {

		it("with no subtasks", function() {
			var task = new MonkeyBars.ParallelTask();
			task.start();
			expect(task.state).toEqual(4);
		});

		it("with subtasks", function() {
			var task = new MonkeyBars.ParallelTask({
				tasks: [{
					performTask: function() {
						this.complete();
					}
				}]
			});
			task.start();
			expect(task.tasks.length).toEqual(1);
			expect(task.state).toEqual(4);
		});

		it("and only completes after all subtasks are complete", function() {

			var CustomTask = MonkeyBars.Task.extend({
				performTask: function() {
					this.complete();
				}
			});

			var t1 = new CustomTask();
			var t2 = new CustomTask();
			var t3 = new CustomTask({
				performTask: function() {
					this.complete();
				}
			});

			var group = new MonkeyBars.ParallelTask({
				tasks: [t1, t2, t3]
			});

			group.start();

			waitsFor(function() {
				return group.state > MonkeyBars.TaskStates.Started;
			}, "the task to complete", 750);

			runs(function() {
				expect(group.state).toEqual(MonkeyBars.TaskStates.Completed);
			});

		});

		it("only once its dependencies have", function() {

			var t1 = new MonkeyBars.Task({
				name: "t1",
				performTask: function() {}
			});

			var t2 = new MonkeyBars.Task({
				name: "t2",
				dependencies: [t1],
				performTask: function() {
					this.complete();
				}
			});

			var t3 = new MonkeyBars.Task({
				name: "t3",
				dependencies: [t2],
				performTask: function() {
					this.complete();
				}
			});

			var group = new MonkeyBars.ParallelTask({
				tasks: [t1, t2, t3]
			});

			group.start();

			expect(t2.state).not.toEqual(MonkeyBars.TaskStates.Completed);
			expect(t3.state).not.toEqual(MonkeyBars.TaskStates.Completed);

			t1.complete();

			expect(t2.state).toEqual(MonkeyBars.TaskStates.Completed);
			expect(t3.state).toEqual(MonkeyBars.TaskStates.Completed);
			expect(group.state).toEqual(MonkeyBars.TaskStates.Completed);

			group.destroy();

		});

		it("when deeply nested",function(){

			var group = new MonkeyBars.ParallelTask({
				//logLevel:MonkeyBars.LogLevels.Verbose,
				tasks:[{
					type:"parallel",
					tasks:[{
						type:"parallel",
						tasks:[{
							type:"parallel",
							tasks:[{
								performTask:function(){
									this.complete();
								}
							}]
						}]
					}]
				}]
			});

			group.start();
			expect(group.state).toEqual(MonkeyBars.TaskStates.Completed);

		});

	});

	// ===================================================================
	// === Data Operation Tests ==========================================
	// ===================================================================

	// @TODO: Need to rework this

	describe("task operates", function() {

		it("with simple", function() {

			var CustomTask = MonkeyBars.Task.extend({
				performTask: function() {
					this.complete(this.name);
				}
			});

			var task = new MonkeyBars.ParallelTask({
				//logLevel:1000,
				data:"a",
				tasks: [
					new CustomTask({name:"b"})
				]
			});

			task.start();
			expect(task.data).toEqual("b");

		});

		it("when overridden", function() {

			var CustomTask = MonkeyBars.Task.extend({
				performTask: function() {
					this.complete(10);
				}
			});

			var task = new MonkeyBars.ParallelTask({
				tasks: [new CustomTask({name:"s1"}), new CustomTask({name:"s2"}), new CustomTask({name:"s3"})],
				operate: function(data, task) {
					if(this.data === undefined) {
						this.data = data;
					} else {
						this.data = this.data + data;
					}
				}
			});

			task.start();
			expect(task.data).toEqual(30);

		});

		it("when deeply overridden", function() {

			var CustomTask = MonkeyBars.Task.extend({
				performTask: function() {
					this.complete(10);
				}
			});

			var task = new MonkeyBars.ParallelTask({
				tasks: [
					new CustomTask({name:"s1"}), 
					{
						name:"s2",
						type:MonkeyBars.TaskTypes.Parallel,
						tasks:[
							new CustomTask({
								name:"s2_a",
								operate:function(data,task){
									this.data = data*4;
								}
							}),
							new CustomTask({name:"s2_b"})
						],
						operate:function(data,task){
							if(this.data === undefined) {
								this.data = data*2;
							} else {
								this.data = this.data + (data*2);
							}
						}
					},
					new CustomTask({name:"s3"}), 
					new CustomTask({name:"s4"})
				],
				operate: function(data, task) {
					if(this.data === undefined) {
						this.data = data;
					} else {
						this.data = this.data + data;
					}
				}
			});

			task.start();
			expect(task.data).toEqual(130);

		});

	});

	// ===================================================================
	// === Decorator Tests ===============================================
	// ===================================================================
	
	describe("task decorates", function() {

		var value, flag;

		beforeEach(function() {});

		afterEach(function() {
			value = undefined;
			flag = undefined;
		});

		it("with count", function() {
			var index = 0;
			var task = new MonkeyBars.ParallelTask({
				count: 3,
				tasks: [{
					performTask: function() {
						index++;
						this.complete();
					}
				}, {
					performTask: function() {
						index += 2;
						this.complete();
					}
				}]
			});
			task.start();
			expect(index).toEqual(9);
		});

	});

	// ===================================================================
	// === Concurrent Excecution Tests ===================================
	// ===================================================================
	
	describe("concurrent tasks", function() {

		// return if we can actually test concurrent functionality
		try {
			var blob = new Blob([""]);
		} catch(e) {
			return;
		}

		var task, t1, t2, t3;

		beforeEach(function() {
			t1 = new MonkeyBars.Task({
				name: "t1",
				performTask: function() {
					this.complete();
				}
			});
			t2 = new MonkeyBars.Task({
				name: "t2",
				performTask: function() {
					this.complete();
				}
			});
			t3 = new MonkeyBars.Task({
				name: "t3",
				performTask: function() {
					this.complete();
				}
			});
			task = new MonkeyBars.ParallelTask({
				name: "ConcurrentParallelTask",
				concurrent: true,
				tasks: [t1, t2, t3]
			});
		});

		afterEach(function() {
			value = undefined;
			flag = undefined;
		});

		it("complete", function() {

			task.start();

			waitsFor(function() {
				return task.state > MonkeyBars.TaskStates.Started;
			}, "the task to complete", 750);

			runs(function() {
				expect(task.state).toEqual(MonkeyBars.TaskStates.Completed);
			});

		});

		it("cancel", function() {

			t2.performTask = function() {};
			task.start();
			task.cancel();

			expect(t2.state).toEqual(MonkeyBars.TaskStates.Canceled);
			expect(task.state).toEqual(MonkeyBars.TaskStates.Canceled);

		});

		it("fault", function() {

			t2.performTask = function() {
				this.fault();
			};
			task.start();

			waitsFor(function() {
				return task.state > MonkeyBars.TaskStates.Started;
			}, "the task to complete", 750);

			runs(function() {
				expect(task.state).toEqual(MonkeyBars.TaskStates.Faulted);
			});

		});

		it("timeout", function() {

			task.timeout = 150;
			t2.performTask = function() { /* TIMEOUT */
			};
			task.start();

			waitsFor(function() {
				return task.state > MonkeyBars.TaskStates.Started;
			}, "the task to complete", 750);

			runs(function() {
				expect(task.state).toEqual(MonkeyBars.TaskStates.Faulted);
			});

		});

		it("complete when deeply nested", function() {

			var group = new MonkeyBars.ParallelTask({
				name: "deepParallel",
				tasks: [{
					performTask: function() {
						this.complete();
					}
				}]
			});

			task.addSubTask(group);

			task.start();

			waitsFor(function() {
				return task.state > MonkeyBars.TaskStates.Started;
			}, "the task to complete", 750);

			runs(function() {
				expect(task.state).toEqual(MonkeyBars.TaskStates.Completed);
			});

		});

	});

});