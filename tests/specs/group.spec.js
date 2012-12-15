describe("Group Tests", function() {

	beforeEach(function() {});
	afterEach(function() {});

	it("Mixing syntaxes still results in acceptable group task",function(){
		
		var sequenceTask = MonkeyBars.SequenceTask.extend({
			name:"name",
			tasks:[{
				name:"subtask1",
				performTask:function(){
					this.complete();
				}
			}]
		});

		var subtask2 = MonkeyBars.Task.extend();
		subtask2.name = "subtask2";
		subtask2.performTask = function(){
			this.complete();
		}

		sequenceTask.addSubTask(subtask2);

		sequenceTask.start();
		expect(sequenceTask.tasks.length).toEqual(2);
		expect(sequenceTask.type).toEqual("sequence");
		expect(sequenceTask.name).toEqual("name");
		expect(sequenceTask.state).toEqual(4);
	});

});