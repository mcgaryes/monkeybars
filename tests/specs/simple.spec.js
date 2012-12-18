describe("Simple Task Tests", function() {

	beforeEach(function() {});
	afterEach(function() {});

	// ===================================================================
	// === Initialization Tests ==========================================
	// ===================================================================

	describe("Initialization Tests", function() {

		it("Initializing With Type",function(){
			var task = MonkeyBars.create({
				name:"task",
				type:"simple",
				loggingEnabled:false,
				performTask:function(){
					this.complete();
				}
			});
			expect(task.type).toEqual("simple");
			expect(task.name).toEqual("task");
			expect(task.state).toEqual(0);
		});

		it("Initializing Without Type",function(){
			var task = MonkeyBars.create({
				name:"task",
				loggingEnabled:false,
				performTask:function(){
					this.complete();
				}
			});
			expect(task.type).toEqual("simple");
			expect(task.name).toEqual("task");
			expect(task.state).toEqual(0);
		});



		/*

		it("Initializing simple task",function(){
			var task = new MonkeyBars.Task({
				name:"custom",
				performTask:function(){
					this.complete();
				}
			});
			expect(task.type).toEqual("simple");
			expect(task.name).toEqual("custom");
			expect(task.state).toEqual(0);
			task.start();
			expect(task.state).toEqual(4);
		});

		it("Extention is possible",function(){
			
			var CustomSimple = MonkeyBars.Task.extend({
				name:"CustomSimple"
			});

			console.log(CustomSimple);

		});

		*/

	});

	

	// ===================================================================
	// === Decorator Tests ===============================================
	// ===================================================================

	describe("Decorator Tests", function() {

		it("FOR",function(){
			var index = 0;
			var task = MonkeyBars.create({
				count:3,
				performTask:function(){
					index++;
					this.complete();
				}
			});
			task.start();
			expect(index).toEqual(3);
		});
/*
		it("FOR & WHEN decorators perform as expected",function(){
			var flag = false;
			var index = 0;
			var task = new MonkeyBars.Task({
				count:2,
				performTask:function(){
					index++;
					this.complete();
				},
				when:function(){
					return flag;
				}
			});
			task.start();
			runs(function() { setTimeout(function() { flag = true; }, 50); });
			waitsFor(function() { return flag; }, "The task should be completed now", 100);
			runs(function() { expect(index).toEqual(2); });
		});

		it("WHEN decorator performs as expected",function(){
			var flag = false;
			var index = 0;
			var task = new MonkeyBars.Task({
				performTask:function(){
					index++;
					this.complete();
				},
				when:function(){
					return flag;
				}
			});
			task.start();
			runs(function() { setTimeout(function() { flag = true; }, 50); });
			waitsFor(function() { return flag; }, "The task should be completed now", 100);
			runs(function() { expect(index).toEqual(1); });
		});

		it("WHILE decorator performs as expected",function(){
			var flag = true;
			var index = 0;
			var task = new MonkeyBars.Task({
				interval:100,
				performTask:function(){
					index++;
					this.complete();
				},
				while:function(){
					return flag;
				}
			});
			task.start();
			runs(function() { setTimeout(function() { flag = false; }, 150); });
			waitsFor(function() { return !flag; }, "The task should be completed now", 160);
			runs(function() { expect(index).toEqual(2); });
		});

	*/
	});
/*
	// ===================================================================
	// === Structural Tests ==============================================
	// ===================================================================

	describe("Structural Tests", function() {

		it("Setting simple task properties with . syntax after creation get applied",function(){
			var task = new MonkeyBars.Task();
			task.name = "name";
			task.performTask = function(){
				this.complete();
			}
			task.start();
			expect(task.type).toEqual("simple");
			expect(task.name).toEqual("name");
			expect(task.state).toEqual(4);
		});

		it("Mixing syntaxes still results in acceptable simple task",function(){
			var task = new MonkeyBars.Task({
				name:"name"
			});
			task.performTask = function(){
				this.complete();
			}
			task.start();
			expect(task.type).toEqual("simple");
			expect(task.name).toEqual("name");
			expect(task.state).toEqual(4);
		});

	});

	*/

});