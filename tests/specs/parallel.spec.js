describe("Parallel Task Tests", function() {

	// ===================================================================
	// === Initialization Tests ==========================================
	// ===================================================================

	describe("Initialization Tests", function() {

		it("Initialization as expected",function(){
			var task = new MonkeyBars.ParallelTask({
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

	});

	// ===================================================================
	// === Decorator Tests ===============================================
	// ===================================================================

	describe("Decorator Tests", function() {

		it("FOR decorator performs as expected",function(){
			var index = 0;
			var task = new MonkeyBars.ParallelTask({
				count:3,
				loggingEnabled:false,
				tasks:[{
					name:"subtask1",
					performTask:function(){
						index++;
						this.complete();
					}
				},
				{
					name:"subtask2",
					performTask:function(){
						index++;
						this.complete();
					}
				},
				{
					name:"subtask2",
					performTask:function(){
						index++;
						this.complete();
					}
				}]
			});
			task.start();
			expect(index).toEqual(9);
		});

	});

	// ===================================================================
	// === Structural Tests ==============================================
	// ===================================================================

	describe("Structural Tests", function() {

	});

});