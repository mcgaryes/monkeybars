describe("Parallel Task Tests", function() {

	// ===================================================================
	// === Initialization Tests ==========================================
	// ===================================================================
	describe("Initialization Tests", function() {

		it("Initialization", function() {
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
	describe("Task Injection Tests", function() {

		it("Add Sub Task", function() {

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
	describe("Execution Tests", function() {

		it("Execution With No Subtasks", function() {
			var task = new MonkeyBars.ParallelTask();
			task.start();
			expect(task.state).toEqual(4);
		});

		it("Execution With Subtasks", function() {
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

		it("Group Completes After All Subtasks Are Complete", function() {

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

		it("Can Only Run MAX Amount Simultaniously", function() {

			var tasks = [];

			for(var i = 0; i < 20; i++) {
				tasks.push(new MonkeyBars.Task({
					name: "task" + i,
					performTask: function() {
						var delegate = this;
						setTimeout(function() {
							delegate.complete();
						}, 10);
					}
				}));
			};

			var group = new MonkeyBars.ParallelTask({
				max: 3,
				tasks: tasks,
				onComplete: function() {
					groupTaskComplete = new Date().getTime();
				}
			});

			group.start();
			expect(group.processedIndex).toEqual(3);

			runs(function() {
				setTimeout(function() {
					expect(group.state).toEqual(4);
				}, 300);
			});

		});

		it("Sub Tasks Should Only Run Once Their Dependencies Have", function() {

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

		});

	});

	// ===================================================================
	// === Data Operation Tests ==========================================
	// ===================================================================

	describe("Data Operation Tests", function() {

		it("Simple", function() {

			var CustomTask = MonkeyBars.Task.extend({
				performTask: function() {
					this.complete(this.name);
				}
			});

			var task = new MonkeyBars.ParallelTask({
				data:"a",
				tasks: [
					new CustomTask({name:"b"})
				]
			});

			task.start();
			expect(task.data).toEqual("b");

		});

		it("Overridden Operation Case 1", function() {

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

		it("Overridden Operation Case 2", function() {

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
	describe("Decorator Tests", function() {

		var value, flag;

		beforeEach(function() {});

		afterEach(function() {
			value = undefined;
			flag = undefined;
		});

		it("FOR", function() {
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
	describe("Concurrent Excecution Tests", function() {

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

		it("Concurrent ParallelTask Completes", function() {

			task.start();

			waitsFor(function() {
				return task.state > MonkeyBars.TaskStates.Started;
			}, "the task to complete", 750);

			runs(function() {
				expect(task.state).toEqual(MonkeyBars.TaskStates.Completed);
			});

		});

		it("Concurrent ParallelTask Canceles", function() {

			t2.performTask = function() {};
			task.start();
			task.cancel();

			expect(t2.state).toEqual(MonkeyBars.TaskStates.Canceled);
			expect(task.state).toEqual(MonkeyBars.TaskStates.Canceled);

		});

		it("Concurrent ParallelTask Faults", function() {

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

		it("Concurrent ParallelTask Timesout", function() {

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

		it("Deeply Nested Concurrent ParallelTask Completes", function() {

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