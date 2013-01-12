describe("Task Group Tests", function() {

	// ===================================================================
	// === Extension Tests ===============================================
	// ===================================================================
	
	describe("Extension Tests", function() {

		it("Extending Group And Adding To Another Group Should Perform As Expected", function() {

			var CustomGroup = MonkeyBars.TaskGroup.extend({
				type: "CustomGroupType",
				performTask: function() {
					for(var i = 0; i < this.tasks.length; i++) {
						this.processSubTask(this.tasks[i]);
					}
				},
				onSubTaskComplete: function() {
					this.currentIndex++;
					if(this.currentIndex == this.tasks.length) {
						this.complete();
					}
				}
			});

			var g = new CustomGroup({
				tasks: [{
					performTask: function() {
						this.complete();
					}
				}]
			});

			var sg = new MonkeyBars.SequenceTask({
				tasks: [{
					performTask: function() {
						this.complete();
					}
				},
				g,
				{
					performTask: function() {
						this.complete();
					}
				}]
			});

			sg.start();
			expect(sg.state).toEqual(4);
		});

	});

});