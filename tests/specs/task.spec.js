describe("Task Initialization Tests", function() {

	beforeEach(function() {});
	afterEach(function() {});

	it("Initializing simple task",function(){
		var task = TaskLibrary.Task.extend({
			name:"name",
			performTask:function(){
				this.complete();
			}
		});
		expect(task.type).toEqual("simple");
		expect(task.name).toEqual("name");
		expect(task.state).toEqual(0);
		task.start();
		expect(task.state).toEqual(4);
	});

	it("Initializing sequence task",function(){
		var task = TaskLibrary.SequenceTask.extend({
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

		expect(task.type).toEqual("sequence");
		expect(task.name).toEqual("name");
		expect(task.state).toEqual(0);
		task.start();
		expect(task.state).toEqual(4);
	});

	it("Initializing parallel task",function(){
		var task = TaskLibrary.ParallelTask.extend({
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

	it("Setting simple task properties with . syntax after creation get applied",function(){
		
		var task = TaskLibrary.Task.extend();
		task.name = "name";
		task.performTask = function(){
			this.complete();
		}

		task.start();

		expect(task.type).toEqual("simple");
		expect(task.name).toEqual("name");
		expect(task.state).toEqual(4);
	});

	it("Setting sequence task properties with . syntax after creation get applied",function(){
		
		var sequenceTask = TaskLibrary.SequenceTask.extend();
		sequenceTask.name = "name";
		
		var subtask1 = TaskLibrary.Task.extend();
		subtask1.name = "subtask1";
		subtask1.performTask = function(){
			this.complete();
		}

		var subtask2 = TaskLibrary.Task.extend();
		subtask2.name = "subtask2";
		subtask2.performTask = function(){
			this.complete();
		}

		sequenceTask.tasks = [subtask1,subtask2];

		sequenceTask.start();

		expect(sequenceTask.type).toEqual("sequence");
		expect(sequenceTask.name).toEqual("name");
		expect(sequenceTask.state).toEqual(4);
	});

	it("Mixing syntaxes still results in acceptable simple task",function(){
		
		var task = TaskLibrary.Task.extend({
			name:"name"
		});
		task.performTask = function(){
			this.complete();
		}
		task.start();

		expect(task.type).toEqual("simple");
		expect(task.name).toEqual("name");
		expect(task.state).toEqual(4);
	});

	it("Mixing syntaxes still results in acceptable group task",function(){
		
		var sequenceTask = TaskLibrary.SequenceTask.extend({
			name:"name",
			tasks:[{
				name:"subtask1",
				performTask:function(){
					this.complete();
				}
			}]
		});

		var subtask2 = TaskLibrary.Task.extend();
		subtask2.name = "subtask2";
		subtask2.performTask = function(){
			this.complete();
		}

		sequenceTask.addSubTask(subtask2);

		console.log(sequenceTask);

		sequenceTask.start();
		expect(sequenceTask.tasks.length).toEqual(2);
		expect(sequenceTask.type).toEqual("sequence");
		expect(sequenceTask.name).toEqual("name");
		expect(sequenceTask.state).toEqual(4);
	});

});

/*
describe("Task Execution Cycle Tests", function() {

	var task;

	beforeEach(function() {
		task = TaskLibrary.Task.extend({
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
*/