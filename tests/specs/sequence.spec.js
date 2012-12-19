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
	// === Task Dependency Tests =========================================
	// ===================================================================

	describe("Dependency Tests", function() {

		it("Canceling SubTask Cancels Its Dependencies",function(){
			
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
			var t4 = new Custom({name:"four"});
			var t5 = new Custom({ name:"five", dependencies:[t3] });

			var sequence = new MonkeyBars.SequenceTask({
				loggingEnabled:false,
				tasks:[t1,t2,t3,t4,t5]
			});

			sequence.start();
			expect(index).toEqual(2);

		});


		it("Canceling SubTask Cancels Its Dependencies With Mixed Syntax",function(){

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

			// thoughts... if i give the user the ability to provide there own ids for tasks
			// then i could still have the ability to set dependencies even with the JSON
			// syntax... I am thinking that it shouldn't be called tid at that point... i think
			// that i should also look for a property of id and use that when doing the lookup
			// as well. if the user defined id is present than I should look at this as well 
			// when deciding whether or not to cancel the task

			var t2 = new Custom({ name:"two" });
			var t4 = new Custom({name:"four"});
			var t5 = new Custom({ name:"five", dependencies:[t3] });

			var sequence = new MonkeyBars.SequenceTask({
				loggingEnabled:false,
				tasks:[t1,t2,new Custom({ name:"three", dependencies:[t1] }),t4,t5]
			});

			sequence.start();
			expect(index).toEqual(2);

		});


	});

});