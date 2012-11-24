describe("Task Initialization Tests", function() {

	beforeEach(function() {});
	afterEach(function() {});

	it("Default properties should be set", function() {

		var task = TaskLibrary.create({
			name:"InitializationTestTask",
			perform:function(){
				return "perform";
			},
			change:function(state,error){
				return 'change';
			}
		});

		expect(task.name).toEqual("InitializationTestTask");
		expect(task.tasks).not.toBeDefined();
		expect(task.state).toEqual(0);
		expect(task.perform()).toEqual("perform");
		expect(task.change()).toEqual("change");

	});

	it("Expect 'type' to be simple by default", function() {
		var task = TaskLibrary.create({});
		expect(task.type).toEqual("simple");
	});

	it("Expect 'type' to be sequence by default when sub tasks are listed", function() {
		var task = TaskLibrary.create({
			tasks:[{}]
		});
		expect(task.type).toEqual("sequence");
	});

	it("Expect 'type' to be parallel when sub tasks are listed and type is set", function() {
		var task = TaskLibrary.create({
			type:"parallel",
			tasks:[{}]
		});
		expect(task.type).toEqual("parallel");
	});

	it("Initializing with ./new syntax creates a simple task that executes",function(){
		var task = new TaskLibrary.Task({
			name:"name",
			perform:function(){
				this.complete();
			}
		});
		expect(task.type).toEqual("simple");
		expect(task.name).toEqual("name");
		expect(task.state).toEqual(0);
		task.start();
		expect(task.state).toEqual(4);
	});

	it("Initializing sequence with ./new syntax creates a simple task that executes",function(){
		var task = new TaskLibrary.SequenceTask({
			name:"name",
			tasks:[{
				name:"subtask",
				perform:function(){
					this.complete();
				}
			}],
			perform:function(){
				this.complete();
			}
		});

		expect(task.type).toEqual("sequence");
		expect(task.name).toEqual("name");
		expect(task.state).toEqual(0);
		task.start();
		expect(task.state).toEqual(4);
	});

	it("Initializing parallel with ./new syntax creates a simple task that executes",function(){
		var task = new TaskLibrary.ParallelTask({
			name:"name",
			tasks:[{
				name:"subtask",
				perform:function(){
					this.complete();
				}
			}],
			perform:function(){
				this.complete();
			}
		});

		expect(task.type).toEqual("parallel");
		expect(task.name).toEqual("name");
		expect(task.state).toEqual(0);
		task.start();
		expect(task.state).toEqual(4);
	});

	it("Setting simple task properties with . syntax after creation get applied",function(){
		
		var task = new TaskLibrary.Task();
		task.name = "name";
		task.perform = function(){
			this.complete();
		}

		task.start();

		expect(task.type).toEqual("simple");
		expect(task.name).toEqual("name");
		expect(task.state).toEqual(4);
	});

	it("Setting sequence task properties with . syntax after creation get applied",function(){
		
		var sequenceTask = new TaskLibrary.SequenceTask();
		sequenceTask.name = "name";
		
		var subtask1 = new TaskLibrary.Task();
		subtask1.name = "subtask1";
		subtask1.perform = function(){
			this.complete();
		}

		var subtask2 = new TaskLibrary.Task();
		subtask2.name = "subtask2";
		subtask2.perform = function(){
			this.complete();
		}

		sequenceTask.tasks = [subtask1,subtask2];

		sequenceTask.start();

		expect(sequenceTask.type).toEqual("sequence");
		expect(sequenceTask.name).toEqual("name");
		expect(sequenceTask.state).toEqual(4);
	});

	it("Mixing syntaxes still results in acceptable simple task",function(){
		
		var task = new TaskLibrary.Task({
			name:"name"
		});
		task.perform = function(){
			this.complete();
		}
		task.start();

		expect(task.type).toEqual("simple");
		expect(task.name).toEqual("name");
		expect(task.state).toEqual(4);
	});

	it("Mixing syntaxes still results in acceptable group task",function(){
		
		var sequenceTask = new TaskLibrary.SequenceTask({
			name:"name",
			tasks:[{
				name:"subtask1",
				perform:function(){
					this.complete();
				}
			}]
		});
		
		var subtask2 = new TaskLibrary.Task();
		subtask2.name = "subtask2";
		subtask2.perform = function(){
			this.complete();
		}

		sequenceTask.addSubTask(subtask2);

		sequenceTask.start();
		expect(sequenceTask.tasks.length).toEqual(2);
		expect(sequenceTask.type).toEqual("sequence");
		expect(sequenceTask.name).toEqual("name");
		expect(sequenceTask.state).toEqual(4);
	});

});

describe("Task Execution Cycle Tests", function() {

	var task;

	beforeEach(function() {
		task = TaskLibrary.create({
			name:"ExecutionTestTask",
			perform:function(){}
		});
	});

	afterEach(function() {
		task = null;
	});

	it("Default state should be 0", function() {
		expect(task.state).toEqual(0);
	});

	it("After started state should be 1", function() {
		task.start();
		expect(task.state).toEqual(1);
	});

	it("After canceled state should be 2", function() {
		task.start();
		task.cancel();
		expect(task.state).toEqual(2);
	});

	it("After faulted state should be 2", function() {
		task.start();
		task.fault();
		expect(task.state).toEqual(3);
	});

	it("After completed state should be 4", function() {
		task.start();
		task.complete();
		expect(task.state).toEqual(4);
	});

});

describe("Sequence Task Tests", function() {

	beforeEach(function() {});
	afterEach(function() {});

	it("Sequence task should complete", function() {
		var task = TaskLibrary.create({
			name:"SequenceTaskTests",
			tasks:[{
				name:"SubTaskSimple",
				perform:function(){
					this.complete();
				}
			}]
		});

		task.start();
		expect(task.state).toEqual(4);

	});

	it("Product should be operated on", function() {

		var task = TaskLibrary.create({
			name:"SequenceTaskTests",
			product:1,
			tasks:[{
				perform:function(){
					this.group.product = this.group.product/2;
					this.complete();
				}
			},
			{
				perform:function(){
					this.group.product = this.group.product * 4;
					this.complete();
				}
			},
			{
				perform:function(){
					this.group.product = this.group.product * 2;
					this.complete();
				}
			}]
		});

		task.start();
		expect(task.product).toEqual(4);

	});

});