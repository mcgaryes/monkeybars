describe("Sequence Task Tests", function() {

	// ===================================================================
	// === Initialization Tests ==========================================
	// ===================================================================

	describe("Initialization Tests", function() {

		it("Initialization With Type",function(){
			var task = new MonkeyBars.SequenceTask({ name:"name" });
			expect(task.type).toEqual("sequence");
			expect(task.name).toEqual("name");
			expect(task.state).toEqual(0);
		});

	});

	// ===================================================================
	// === Task Injection Tests ==========================================
	// ===================================================================

	describe("Task Injection Tests", function() {

		it("Add SubTask",function(){
			
			var s = new MonkeyBars.SequenceTask({
				tasks:[
					{name:"one"},
					{name:"two"},
					{name:"three"}
				]
			});

			s.addSubTask({name:"four"});

			expect(s.tasks.length).toEqual(4);
			expect(s.tasks[3].name).toEqual("four");
		});

		it("Add SubTask After SubTask",function(){
			var s = new MonkeyBars.SequenceTask({
				tasks:[
					{name:"one"},
					{name:"two"},
					{name:"three"}
				]
			});

			s.addSubTaskAfterTask({name:"four"},s.getTaskByName("two"));

			expect(s.tasks.length).toEqual(4);
			expect(s.tasks[2].name).toEqual("four");

		});

		it("Add SubTask Before SubTask",function(){
			var s = new MonkeyBars.SequenceTask({
				tasks:[
					{name:"one"},
					{name:"two"},
					{name:"three"}
				]
			});

			s.addSubTaskBeforeTask({name:"four"},s.getTaskByName("two"));

			expect(s.tasks.length).toEqual(4);
			expect(s.tasks[1].name).toEqual("four");

		});

	});

	// ===================================================================
	// === Task Dependency Tests =========================================
	// ===================================================================

	describe("Dependency Tests", function() {


		it("Canceling SubTask Cancels Its Dependencies",function(){
			
			return;

			var index = 0;

			var Custom = MonkeyBars.Task.extend({
				name:"Custom",
				performTask:function(){
					if(this.state == MonkeyBars.TaskStates.Canceled) return;
					index++;
					this.complete();
				}
			});

			var t1 = new Custom({ 
				name:"one",
				performTask:function(){
					this.cancel();
				}
			});
			var t2 = new Custom({ name:"two" });
			var t3 = new Custom({ name:"three", dependencies:[t1] });
			var t4 = new Custom({ name:"four"});
			var t5 = new Custom({ name:"five", dependencies:[t3] });

			var sequence = new MonkeyBars.SequenceTask({
				loggingEnabled:false,
				tasks:[t1,t2,t3,t4,t5]
			});

			sequence.start();
			expect(index).toEqual(2);

		});

		it("Canceling SubTask Cancels Its Dependencies With JSON Syntax",function(){
			
			var index = 0;

			var Custom = MonkeyBars.Task.extend({
				name:"Custom",
				performTask:function(){
					if(this.state == MonkeyBars.TaskStates.Canceled) return;
					index++;
					this.complete();
				}
			});

			var sequence = new MonkeyBars.SequenceTask({
				tasks:[
					new Custom({ id:"one", name:"one", performTask:function(){ this.cancel(); } }),
					new Custom({ id:"two", name:"two" }),
					new Custom({ id:"three", name:"three", dependencies:["one"] }),
					new Custom({ id:"four", name:"four" }),
					new Custom({ id:"five", name:"five", dependencies:["one"] })
				]
			});

			sequence.start();
			expect(index).toEqual(2);

		});

		it("Canceling SubTask Cancels Its Dependencies With MIXED Syntax",function(){
			
			var index = 0;

			var Custom = MonkeyBars.Task.extend({
				performTask:function(){
					if(this.state == MonkeyBars.TaskStates.Canceled) return;
					index++;
					this.complete();
				}
			});

			var t1 = new Custom({ 
				name:"one", 
				performTask:function(){ 
					this.cancel(); 
				} 
			});

			var sequence = new MonkeyBars.SequenceTask({
				loggingEnabled:false,
				tasks:[
					t1,
					new Custom({ name:"two_name"}),
					new Custom({ id:"three", name:"three", dependencies:["one"] }),
					new Custom({ id:"four_id", name:"four" }),
					{ 
						id:"five", 
						name:"five", 
						dependencies:["three"] 
					},
					new Custom({ id:"six", name:"six", dependencies:["five"] })
				]
			});

			sequence.start();
			expect(index).toEqual(2);

		});
	});

	// ===================================================================
	// === Excecution Tests ==============================================
	// ===================================================================

	describe("Excecution Tests", function() {

		var task, t1, t2, t3;

		beforeEach(function() {
			
			t1 = new MonkeyBars.Task({ performTask:function(){} });
			t2 = new MonkeyBars.Task({ performTask:function(){} });
			t3 = new MonkeyBars.Task({ performTask:function(){} });

			task = new MonkeyBars.SequenceTask({
				tasks:[t1,t2,t3]
			});

		});

		afterEach(function() {
			task = t1 = t2 = t3 = undefined;
		});
		
		it("Task Does Not Start Next Task After Canceled",function(){
			task.start();
			task.cancel();
			task.startNextSubTask();
			expect(task.currentIndex).toEqual(1);
		});

		it("Task Does Not Start Next Task After Complete",function(){
			task.complete();
			task.startNextSubTask();
			expect(task.currentIndex).toEqual(0);
		});

		it("Task Does Not Start Next Task After Faulted",function(){
			task.fault(null);
			task.startNextSubTask();
			expect(task.currentIndex).toEqual(0);
		});

		it("Task Starts Next Sub Task After Sub Task Canceled",function(){
			task.start();
			var subtask = task.getTaskByTid(t1.tid);
			subtask.cancel();
			expect(task.currentIndex).toEqual(2);
		});

		it("Task Starts Next Sub Task After Sub Task Completes",function(){
			task.start();
			var subtask = task.getTaskByTid(t1.tid);
			subtask.complete();
			expect(task.currentIndex).toEqual(2);
		});

		it("Task Faults After Sub Task Faults",function(){
			task.start();
			var subtask = task.getTaskByTid(t1.tid);
			subtask.fault();
			expect(task.state).toEqual(MonkeyBars.TaskStates.Faulted);
		});

		it("Task Does Increment Current Index",function(){
			task.start();
			var subtask = task.getTaskByTid(t1.tid);
			subtask.complete();
			expect(task.currentIndex).toEqual(2);
		});
	});

	// ===================================================================
	// === Task Product Tests ============================================
	// ===================================================================

	describe("Product Tests", function() {

		it("Product Manipulates As Expected",function(){
			
			// * NOTE *
			// Imagine that all of the following tasks are in seperate modules and that
			// we need to manipulate a piece of data between all of that tasks without 
			// having a centralized model of any kind... how would it look

			var t1 = new MonkeyBars.Task({
				performTask:function(){
					this.complete(this.product + 10);
				}
			});

			var t2 = new MonkeyBars.Task({
				performTask:function(){
					this.complete(this.product / 2);
				}
			});

			var t3 = new MonkeyBars.Task({
				performTask:function(){
					this.complete(this.product * 3);
				}
			});

			var group = new MonkeyBars.SequenceTask({
				tasks:[t1,t2,t3],
				handleProduct:function(product) {
					this.product = product;
				}
			});

			// @TODO: need to have function on task group that is basically a method that gets called 
			// everytime its product is manipulated. By default passing a product will just set the product
			// to what was passed by the complete function... if the group has

			group.product = 0;
			group.start();

			expect(group.product).toEqual(15);

		});

		// return if we can actually test concurrent functionality
		try { var blob = new Blob([""]); } catch(e) { return; }

		it("Product Manipulates As Expected While Concurrent",function(){

			var perform = function(){
				for ( var i = 0; i < 5000; i++ ) { this.product++; }
				this.complete(this.product);
			};

			var t1 = new MonkeyBars.Task({ name:"t1", performTask:perform });
			var t2 = new MonkeyBars.Task({ name:"t2", performTask:perform });

			var group = new MonkeyBars.SequenceTask({
				concurrent:true,
				tasks:[t1,t2]
			});

			group.product = 0;
			group.start();

			waitsFor(function() {
      			return group.state > MonkeyBars.TaskStates.Started;
    		}, "the task to complete", 750);

			runs(function() {
				expect(group.product).toEqual(10000);
    		});

		});

	});

	// ===================================================================
	// === Concurrent Excecution Tests ===================================
	// ===================================================================

	describe("Concurrent Excecution Tests", function() {
		
		// return if we can actually test concurrent functionality
		try { var blob = new Blob([""]); } catch(e) { return; }

		it("Concurrent SequenceTask Completes",function(){

			var t1 = new MonkeyBars.Task({name:"t1",performTask:function(){ this.complete(); }});
			var t2 = new MonkeyBars.Task({name:"t2",performTask:function(){ this.complete(); }});
			var t3 = new MonkeyBars.Task({name:"t3",performTask:function(){ this.complete(); }});

			var task = new MonkeyBars.SequenceTask({
				name:"ConcurrentParallelTask",
				concurrent:true,
				tasks:[t1,t2,t3]
			});

			task.start();

			waitsFor(function() {
      			return task.state > MonkeyBars.TaskStates.Started;
    		}, "the task to complete", 750);

			runs(function() {
				console.log(task);
		      expect(task.state).toEqual(MonkeyBars.TaskStates.Completed);
    		});

		});

	});

});