describe("For Tests", function() {

	beforeEach(function() {});
	afterEach(function() {});

	// initialization tests

	it("Initializing for task",function(){

		var task = MonkeyBars.ForTask.extend({
			name:"task"
		});

		expect(task.name).toEqual("task");

	});

	// simple execution

	it("For task executes for expected count",function(){

		var index = 0;

		var task = MonkeyBars.ForTask.extend({
			name:"task",
			count:5,
			performTask:function(){
				index++;
				this.complete();
			}
		});

		task.start();

		expect(index).toEqual(5);

	});

	// group inclusion

	it("Initializing ForTask with count within group task performs as expected",function(){

		var index = 0;

		var sequence = MonkeyBars.SequenceTask.extend({
			name:"sequence",
			tasks:[{
				name:"forTask1",
				count:2,
				performTask:function(){
					index++;
					this.complete();
				}
			}]
		});

		sequence.start();
		
		expect(sequence.state).toBe(MonkeyBars.TaskStates.Completed);
		expect(index).toEqual(2);

	});

	it("Initializing ForTask with type within group task performs as expected",function(){

		var index = 0;

		var sequence = MonkeyBars.SequenceTask.extend({
			name:"sequence",
			tasks:[{
				name:"forTask1",
				type:"for",
				performTask:function(){
					index++;
					this.complete();
				}
			}]
		});

		sequence.start();
		
		expect(sequence.state).toBe(MonkeyBars.TaskStates.Completed);
		expect(index).toEqual(1);

	});

	// state tests

	it("Canceling for task stops execution",function(){

		var index = 0;

		var task = MonkeyBars.ForTask.extend({
			name:"task",
			count:5,
			performTask:function(){
				index++;
				if(index==3){
					this.cancel();
					return;
				}
				this.complete();
			}
		});

		task.start();

		expect(index).toEqual(3);
		expect(task.state).toBe(MonkeyBars.TaskStates.Canceled);

	});

	it("Faulting for task stops execution",function(){

		var index = 0;

		var task = MonkeyBars.ForTask.extend({
			name:"task",
			count:5,
			performTask:function(){
				index++;
				if(index==3){
					this.fault();
					return;
				}
				this.complete();
			}
		});

		task.start();

		expect(index).toEqual(3);
		expect(task.state).toBe(MonkeyBars.TaskStates.Faulted);

	});

});