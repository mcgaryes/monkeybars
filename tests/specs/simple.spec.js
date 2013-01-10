describe("Simple Task Tests", function() {

	// ===================================================================
	// === Initialization Tests ==========================================
	// ===================================================================
	
	describe("Initialization Tests", function() {

		it("Initializing With Type", function() {
			var task = new MonkeyBars.Task({
				name: "task"
			});
			expect(task.type).toEqual("simple");
			expect(task.name).toEqual("task");
			expect(task.state).toEqual(0);
		});

		it("Initializing With Dot Notation", function() {
			var task = new MonkeyBars.Task();
			task.performTask = function() {};
			task.start();
			expect(task.state).toEqual(1);
		});

		it("Initializing After Traditional Extention", function() {

			var CustomTask = function(attributes) {
				MonkeyBars.Task.call(this,attributes);
			};

			CustomTask.prototype = Object.create(MonkeyBars.Task.prototype, {
				method: {
					value: function() {
						return 24;
					}
				}
			});

			var task = new CustomTask();
			expect(task.method()).toEqual(24);
			expect(task.performTask).toBeDefined();
		});

		it("Initializing After MonkeyBars Extention Method", function() {
			var CustomTask = MonkeyBars.Task.extend({
				method: function() {
					return 24;
				}
			});
			var task = new CustomTask({
				name: "task"
			});
			expect(task.type).toEqual("simple");
			expect(task.name).toEqual("task");
			expect(task.method()).toEqual(24);
			expect(task.performTask).toBeDefined();
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
			var task = new MonkeyBars.Task({
				count: 3,
				performTask: function() {
					index++;
					this.complete();
				}
			});
			task.start();
			expect(index).toEqual(3);
		});

		it("FOR & WHEN", function() {

			var index = 0;
			var task = new MonkeyBars.Task({
				count: 1,
				performTask: function() {
					this.complete();
				},
				when: function() {
					index++;
					return index > 0;
				}
			});

			task.start();

			waitsFor(function() {
				return task.state > MonkeyBars.TaskStates.Started;
			}, "the task to complete with FOR & WHEN", 1000);

			runs(function() {
				expect(task.state).toEqual(4);
				expect(index).toEqual(1);
			});
		});

		it("WHEN", function() {

			var index = 0;

			var task = new MonkeyBars.Task({
				name: "*** SIMPLE_WHEN ***",
				performTask: function() {
					this.complete();
				},
				when: function() {
					index++;
					return index > 3;
				}
			});

			task.start();

			waitsFor(function() {
				return task.state > MonkeyBars.TaskStates.Started;
			}, "task to complete WHEN", 750);

			runs(function() {
				expect(task.state).toEqual(4);
			});
		});

		it("WHILE", function() {

			var index = 0;
			var task = new MonkeyBars.Task({
				name: "*** SIMPLE_WHEN ***",
				performTask: function() {
					index++;
					this.complete();
				},
				doWhile :function() {
					return index != 3;
				}
			});

			task.start();

			waitsFor(function() {
				return task.state > MonkeyBars.TaskStates.Started;
			}, "the task to complete with WHILE", 1000);

			runs(function() {
				expect(task.state).toEqual(4);
				expect(index).toEqual(3);
			});
		});

	});

	// ===================================================================
	// === Excecution Tests ==============================================
	// ===================================================================
	
	describe("Excecution Tests", function() {

		var task;

		beforeEach(function() {
			task = new MonkeyBars.Task({
				performTask: function() { /* ... */
				}
			});
		});

		afterEach(function() {
			task = undefined;
		});

		it("Task Did Cancel", function() {
			task.cancel();
			expect(task.state).toEqual(MonkeyBars.TaskStates.Canceled)
		});

		it("Task Did Start", function() {
			task.start();
			expect(task.state).toEqual(MonkeyBars.TaskStates.Started)
		});

		it("Task Did Complete", function() {
			task.complete();
			expect(task.state).toEqual(MonkeyBars.TaskStates.Completed);
		});

		it("Task Did Fault", function() {
			task.fault(null);
			expect(task.state).toEqual(MonkeyBars.TaskStates.Faulted);
		});

		it("Task Should Not Start After Completed", function() {
			task.complete();
			task.start();
			expect(task.state).toEqual(MonkeyBars.TaskStates.Completed);
		});

		it("Task Should Not Start After Faulted", function() {
			task.fault(null);
			task.start();
			expect(task.state).toEqual(MonkeyBars.TaskStates.Faulted);
		});

		it("Task Should Not Start After Canceled", function() {
			task.cancel();
			task.start();
			expect(task.state).toEqual(MonkeyBars.TaskStates.Canceled);
		});

		it("Task Should Not Fault After Canceled", function() {
			task.cancel();
			task.fault(null);
			expect(task.state).toEqual(MonkeyBars.TaskStates.Canceled);
		});

		it("Task Should Not Fault After Compelte", function() {
			task.complete();
			task.fault(null);
			expect(task.state).toEqual(MonkeyBars.TaskStates.Completed);
		});

		it("Task Should Not Complete After Fault", function() {
			task.fault(null);
			task.complete();
			expect(task.state).toEqual(MonkeyBars.TaskStates.Faulted);
		});

		it("Task Should Not Complete After Cancel", function() {
			task.cancel();
			task.complete();
			expect(task.state).toEqual(MonkeyBars.TaskStates.Canceled);
		});

		it("Task Should Not Cancel After Fault", function() {
			task.fault(null);
			task.cancel();
			expect(task.state).toEqual(MonkeyBars.TaskStates.Faulted);
		});

		it("Task Should Not Cancel After Complete", function() {
			task.complete();
			task.cancel();
			expect(task.state).toEqual(MonkeyBars.TaskStates.Completed);
		});

		it("Task Should Timeout If 'timeout' Is Set", function() {

			task.timeout = 100;
			task.start();
			var delegate = task;

			waitsFor(function() {
				return task.state == MonkeyBars.TaskStates.Faulted;
			}, "the task to fault", 750);

			runs(function() {
				expect(delegate.state).toEqual(MonkeyBars.TaskStates.Faulted);
			});

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

		var task;

		beforeEach(function() {
			task = new MonkeyBars.Task({
				name: "ConcurrentSimpleTask",
				concurrent: true,
				performTask: function() { /* $!# */
				}
			});
		});

		afterEach(function() {
			task = undefined;
		});

		it("Concurrent Task Does Complete", function() {
			task.performTask = function() {
				this.complete();
			}
			task.start();

			waitsFor(function() {
				return task.state > MonkeyBars.TaskStates.Started;
			}, "the task to complete", 750);

			runs(function() {
				expect(task.state).toEqual(MonkeyBars.TaskStates.Completed);
			});

		});

		it("Concurrent Task Does Cancel", function() {

			task.performTask = function() {
				this.cancel();
			}
			task.start();

			waitsFor(function() {
				return task.state > MonkeyBars.TaskStates.Started;
			}, "the task to complete", 750);

			runs(function() {
				expect(task.state).toEqual(MonkeyBars.TaskStates.Canceled);
			});

		});

		it("Concurrent Task Does Fault", function() {

			task.performTask = function() {
				this.fault();
			}
			task.start();

			waitsFor(function() {
				return task.state > MonkeyBars.TaskStates.Started;
			}, "the task to complete", 750);

			runs(function() {
				expect(task.state).toEqual(MonkeyBars.TaskStates.Faulted);
			});

		});

		it("Concurrent Task Does Timeout", function() {
			task.timeout = 100;
			task.start();

			waitsFor(function() {
				return task.state > MonkeyBars.TaskStates.Started;
			}, "the task to complete", 750);

			runs(function() {
				expect(task.state).toEqual(MonkeyBars.TaskStates.Faulted);
			});

		});

	});


});