describe("Simple Task Tests", function() {

	// ===================================================================
	// === Initialization Tests ==========================================
	// ===================================================================

	describe("Initialization Tests", function() {

		it("Initializing With Type",function(){
			var task = new MonkeyBars.Task({ name:"task" });
			expect(task.type).toEqual("simple");
			expect(task.name).toEqual("task");
			expect(task.state).toEqual(0);
		});

		it("Initializing With Dot Notation",function(){
			var task = new MonkeyBars.Task();
			task.performTask = function() {};
			task.start();
			expect(task.state).toEqual(1);
		});

		it("Initializing After Traditional Extention",function(){
			
			var CustomTask = function(attributes){
				MonkeyBars.Task(this);
			};

			CustomTask.prototype = Object.create(MonkeyBars.Task.prototype,{
				method:{
					value:function(){
						return 24;
					}
				}
			});

			var task = new CustomTask();
			expect(task.method()).toEqual(24);
			expect(task.performTask).toBeDefined();
		});

		it("Initializing After MonkeyBars Extention Method",function(){
			var CustomTask = MonkeyBars.Task.extend({
				method:function(){ 
					return 24; 
				}
			});
			var task = new CustomTask({ name:"task" });
			expect(task.type).toEqual("simple");
			expect(task.name).toEqual("task");
			expect(task.method()).toEqual(24);
			expect(task.performTask).toBeDefined();
		});

	});

	// ===================================================================
	// === Decorator Tests ===============================================
	// ===================================================================

	describe("Decorator Tests", function() {

		var value, flag;

		beforeEach(function() {});

		afterEach(function() {
			value = undefined;
			flag = undefined;
		});

		it("FOR",function(){
			var index = 0;
			var task = new MonkeyBars.Task({
				count:3,
				performTask:function(){
					index++;
					this.complete();
				}
			});
			task.start();
			expect(index).toEqual(3);
		});

		it("FOR & WHEN",function(){

			runs(function() {
				flag = false;
				value = 0;
				setTimeout(function() {
					flag = true;
				}, 200);
			});

			var index = 0;
			var task = new MonkeyBars.Task({
				count:1,
				performTask:function(){
					index++;
					this.complete();
				},
				when:function(){
					return value > 0;
				}
			});

			task.start();

			waitsFor(function() {
		      value++;
		      return flag;
		    }, "task to complete", 1000);

			runs(function() {
      			expect(task.state).toEqual(4);
      			expect(index).toEqual(1);
    		});
		});

		it("WHEN",function(){

			runs(function() {
				flag = false;
				value = 0;
				setTimeout(function() {
					flag = true;
				}, 500);
			});

			var task = new MonkeyBars.Task({
				name:"*** SIMPLE_WHEN ***",
				performTask:function(){
					this.complete();
				},
				when:function(){
					return value > 0;
				}
			});

			task.start();

			waitsFor(function() {
		      value++;
		      return flag;
		    }, "task to complete", 1000);

			runs(function() {
      			expect(task.state).toEqual(4);
    		});
		});

		it("WHILE",function(){
			
			runs(function() {
				flag = false;
				value = 0;
				setTimeout(function() { 
					flag = true; 
				}, 310);
			});

			var index = 0;
			var task = new MonkeyBars.Task({
				name:"*** SIMPLE_WHEN ***",
				performTask:function(){
					index++;
					this.complete();
				},
				while:function(){
					return index < 10;
				}
			});

			task.start();

			waitsFor(function() { 
				return flag; 
			}, "task to complete", 1000);

			runs(function() {
				setTimeout(function() { 
					expect(task.state).toEqual(4);
      				expect(index).toEqual(4);
				}, 100);
    		});
		});

	});

});