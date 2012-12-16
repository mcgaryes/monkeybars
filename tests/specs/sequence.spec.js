describe("Sequence Tests", function() {

	beforeEach(function() {});
	afterEach(function() {});

	it("Initializing sequence task",function(){
		var task = MonkeyBars.SequenceTask.extend({
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

		expect(task.type).toEqual("sequence");
		expect(task.name).toEqual("name");
		expect(task.state).toEqual(0);
		task.start();
		expect(task.state).toEqual(4);
	});

	it("Run sequence task with FOR decorator",function(){
		var index = 0;

		var task = MonkeyBars.SequenceTask.extend({
			name:"******",
			count:2,
			tasks:[{
				name:"subtask",
				perform:function(){
					this.complete();
				}
			}],
			performTask:function(){
				console.log("perform task");
				index++;
				this.complete();
			}
		});
		task.start();

		expect(index).toEqual(2);
		expect(task.state).toEqual(4);
	});

	it("Run sequence task with WHEN decorator",function(){

		var flag = false;
		var index = 0;

		var task = MonkeyBars.SequenceTask.extend({
			name:"******",
			when:function(){
				return flag;
			},
			tasks:[{
				name:"subtask",
				perform:function(){
					this.complete();
				}
			}],
			performTask:function(){
				index++;
				this.complete();
			}
		});
		task.start();
		flag = true;

		//expect(index).toEqual(2);
		//expect(task.state).toEqual(4);
	});

	it("Run sequence task with WHILE decorator",function(){

		var flag = false;
		var index = 0;

		var task = MonkeyBars.SequenceTask.extend({
			loggingEnabled:true,
			while:function(){
				return flag == false;
			},
			tasks:[{
				name:"subtask",
				performTask:function(){
					var delegate = this;
					setTimeout( function(){ delegate.complete(); },100 );
				}
			}]
		});

		task.start();
		setTimeout(function(){ flag = true; },2000);
		

		//expect(index).toEqual(2);
		//expect(task.state).toEqual(4);
	});



	it("Setting sequence task properties with . syntax after creation get applied",function(){
		
		var sequenceTask = MonkeyBars.SequenceTask.extend();
		sequenceTask.name = "name";
		
		var subtask1 = MonkeyBars.Task.extend();
		subtask1.name = "subtask1";
		subtask1.performTask = function(){
			this.complete();
		}

		var subtask2 = MonkeyBars.Task.extend();
		subtask2.name = "subtask2";
		subtask2.performTask = function(){
			this.complete();
		}

		sequenceTask.tasks = [subtask1,subtask2];

		sequenceTask.start();

		expect(sequenceTask.type).toEqual("sequence");
		expect(sequenceTask.name).toEqual("name");
		expect(sequenceTask.state).toEqual(4);
	});


});