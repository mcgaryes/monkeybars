describe("task group", function() {

	// ===================================================================
	// === Extension Tests ===============================================
	// ===================================================================
	
	describe("executes", function() {

		it("after extending", function() {

			var CustomGroup = MonkeyBars.TaskGroup.extend({
				type: "CustomGroupType",
				performTask: function() {
					for(var i = 0; i < this.tasks.length; i++) {
						this.processSubTask(this.tasks[i]);
					}
				},
				onSubTaskComplete: function() {
					this._currentIndex++;
					if(this._currentIndex == this.tasks.length) {
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

			waitsFor(function() {
				return sg.state > MonkeyBars.TaskStates.Started;
			}, "the task to complete", 20000);

			runs(function() {
				expect(sg.state).toEqual(MonkeyBars.TaskStates.Completed);
			});
			
		});

	});

});