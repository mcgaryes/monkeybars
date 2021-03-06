describe("worker", function() {

	// ===================================================================
	// === Extention Tests ===============================================
	// ===================================================================

	describe("task extends", function() {

		// return if we can actually test concurrent functionality
		try {
			var blob = new Blob([""]);
		} catch(e) {
			return;
		}

		it("correctly",function(){

			var CustomWorker = MonkeyBars.WorkerTask.extend({
				customMethod:function(){
					return 42;
				}
			});

			var task = new MonkeyBars.Task();

			var customWorker = new CustomWorker(task);

			expect(CustomWorker.prototype).toBeDefined();
			expect(CustomWorker.prototype.customMethod).toBeDefined();
			expect(customWorker.customMethod()).toEqual(42);

		});

	});

	// ===================================================================
	// === Execution Tests ===============================================
	// ===================================================================

	describe("task executes", function() {

		// return if we can actually test concurrent functionality
		try {
			var blob = new Blob([""]);
		} catch(e) {
			return;
		}

		it("correctly",function(){

			var CustomWorker = MonkeyBars.WorkerTask.extend({
				append:function(product){
					this.postMessage("append",100);
					this.devide(product + 100);
				},
				devide:function(product){
					this.postMessage("devide",2);
					this.complete(product/2);
				}
			});

			var index = 0;

			var task = new MonkeyBars.Task({
				concurrent:true,
				worker:{
					constructor:CustomWorker,
					handler:function(e){
						if(e.data.type === "append") {
							index += e.data.value;
						} else if(e.data.type === "devide") {
							index = index / e.data.value;
						}
					}
				},
				performTask:function(){
					this.append(0);
				}
			});

			task.start();

			waitsFor(function() {
				return task.state > MonkeyBars.TaskStates.Started;
			}, "the task to complete", 750);

			runs(function() {
				expect(task.state).toEqual(MonkeyBars.TaskStates.Completed);
				expect(task.data).toEqual(50);
				expect(index).toEqual(50);
			});


		});
		
	});

});