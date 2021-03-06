describe("sequence", function() {

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

	describe("task dependencies", function() {

		it("for subtasks cancel said subtasks dependencies",function(){

			var index = 0;

			var Custom = MonkeyBars.Task.extend({
				name:"Custom",
				performTask:function(){
					if(this.state === MonkeyBars.TaskStates.Canceled) return;
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
				tasks:[t1,t2,t3,t4,t5]
			});

			sequence.start();

			waitsFor(function() {
      			return sequence.state > MonkeyBars.TaskStates.Started;
    		}, "the task to complete", 750);

			runs(function() {
		      expect(index).toEqual(2);
    		});

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

			waitsFor(function() {
      			return sequence.state > MonkeyBars.TaskStates.Started;
    		}, "the task to complete", 750);

			runs(function() {
		      expect(index).toEqual(2);
    		});

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
				tasks:[
					t1,
					new Custom({ name:"two_name"}),
					new Custom({ id:"three", name:"three", dependencies:[t1] }),
					new Custom({ id:"four_id", name:"four" }),
					{ 
						id:"five", 
						name:"five", 
						dependencies:["three"],
						performTask:function(){
							index++;
							this.complete();
						}
					},
					new Custom({ id:"six", name:"six", dependencies:["five"] })
				]
			});

			sequence.start();

			waitsFor(function() {
      			return sequence.state > MonkeyBars.TaskStates.Started;
    		}, "the task to complete", 750);

			runs(function() {
		      expect(index).toEqual(2);
    		});

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
			expect(task._currentIndex).toEqual(1);
		});

		it("Task Does Not Start Next Task After Complete",function(){
			task.complete();
			task.startNextSubTask();
			expect(task._currentIndex).toEqual(0);
		});

		it("Task Does Not Start Next Task After Faulted",function(){
			task.fault(null);
			task.startNextSubTask();
			expect(task._currentIndex).toEqual(0);
		});

		it("Task Starts Next Sub Task After Sub Task Canceled",function(){
			task.start();
			var subtask = task.getTaskByTid(t1.tid);
			subtask.cancel();
			expect(task._currentIndex).toEqual(2);
		});

		it("Task Starts Next Sub Task After Sub Task Completes",function(){
			task.start();
			var subtask = task.getTaskByTid(t1.tid);
			subtask.complete();
			waitsFor(function() {
				return task._currentIndex > 1;
			}, "index to incriment", 20000);

			runs(function() {
				expect(task._currentIndex).toEqual(2);
			});
			
		});

		it("Task Faults After Sub Task Faults",function(){
			task.start();
			var subtask = task.getTaskByTid(t1.tid);
			subtask.fault();
			expect(task.state).toEqual(MonkeyBars.TaskStates.Faulted);
		});

		it("Task Resets As Expected",function(){
			t1.performTask = t2.performTask = t3.performTask = function(){
				this.complete();
			}
			task.start();
			task.reset();
			expect(task.state).toEqual(0);
			expect(t1.state).toEqual(0);
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
		      expect(task.state).toEqual(MonkeyBars.TaskStates.Completed);
    		});

		});

	});

});