describe("Simple Tests", function() {

	beforeEach(function() {});
	afterEach(function() {});

	it("Initializing simple task",function(){
		var task = MonkeyBars.Task.extend({
			name:"name",
			performTask:function(){
				this.complete();
			}
		});
		expect(task.type).toEqual("simple");
		expect(task.name).toEqual("name");
		expect(task.state).toEqual(0);
		task.start();
		expect(task.state).toEqual(4);
	});

	it("Setting simple task properties with . syntax after creation get applied",function(){
		
		var task = MonkeyBars.Task.extend();
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
		
		var task = MonkeyBars.Task.extend({
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