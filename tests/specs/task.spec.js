describe("Task Initialization Tests", function() {

	beforeEach(function() {});
	afterEach(function() {});

	it("Default properties should be set", function() {

		var task = Task.extend({
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

		var task = Task.extend({});
		expect(task.type).toEqual("simple");

	});

	it("Expect 'type' to be simple when sub tasks is empty", function() {

		/*
		var task = Task.extend({
			type:"parallel",
			tasks:[]
		});
*/

		//expect(task.type).toEqual("simple");

	});

	it("Expect 'type' to be sequence when sub tasks are listed", function() {

/*
		var task = Task.extend({
			tasks:[{}]
		});
*/

		//expect(task.type).toEqual("sequence");

	});

	it("Expect 'type' to be parallel when sub tasks are listed and type is set", function() {

/*
		var task = Task.extend({
			type:"parallel",
			tasks:[{}]
		});
*/
		//expect(task.type).toEqual("parallel");

	});

});

describe("Task Execution Cycle Tests", function() {

	var task;

	beforeEach(function() {
		task = Task.extend({
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

describe("Task Operation Tests", function() {

	beforeEach(function() {});
	afterEach(function() {});

	it("Running operate should just set the product", function() {
		var task = Task.extend({
			name:"OperatorTestTask",
			perform:function(){
				this.operate("b");
				this.complete();
			}
		});
		task.start();
		expect(task.product).toEqual("b");
	});

});

describe("Sequence Task Tests", function() {

	beforeEach(function() {});
	afterEach(function() {});

	it("Sequence task should complete", function() {
		var task = Task.extend({
			name:"SequenceTaskTests",
			tasks:[{
				name:"SubTaskSimple",
				perform:function(){
					this.complete();
				}
			}],
			change:function(state,error) {
				if(state == 4) {
					console.log("complete");
				}
			}
		});

		console.log(task);

		task.start();
		//expect(task.product).toEqual("b");

	});

});

