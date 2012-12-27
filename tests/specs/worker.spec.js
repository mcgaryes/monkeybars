describe("Worker Task Tests", function() {

	// ===================================================================
	// === Extention Tests ===============================================
	// ===================================================================

	describe("Extention Tests", function() {

		// return if we can actually test concurrent functionality
		try {
			var blob = new Blob([""]);
		} catch(e) {
			return;
		}

		it("WorkerTask Should Extend",function(){

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

	describe("Execution Tests", function() {

		// return if we can actually test concurrent functionality
		try {
			var blob = new Blob([""]);
		} catch(e) {
			return;
		}

		it("Custom WorkerTask Executes As Expected",function(){

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
				logLevel:1000,
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
				expect(task.product).toEqual(50);
				expect(index).toEqual(50);
			});


		});
		
	});

});