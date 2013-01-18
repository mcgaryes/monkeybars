describe("Load Tests", function() {

	it("does handle load",function(){

		/*
		
			so before the tasks are started i can go upwards of 60000 tasks
			however when i start the tasks and other things are added i get
			a "RangeError: Maximum call stack size exceeded" error. Before I start
			the root group sequemce sub tasks only contain the following:

				tid: "task1"

			after starting it creates the following:
			
			PARALLEL TASK

				currentIndex: 1
				data: undefined // dont set this if nothing is passed?
				onChange: function (state, error) {
				processed: true
				processedIndex: 1
				state: 4
				tasks: Array[1] // how to i handle these references? so that I dont duplicate these efforts?
				tid: "task1052"

			SIMPLE TASK

				currentIndex: 3
				dependencyMap: Object - remove this and see what happens
				group: ******* MonkeyBars.SequenceTask - is there a better way to reference this? *******
				onChange: function (state, error) {
				processed: true - can this be a getter on the prototype? (isProcessed())
				processedIndex: 3
				state: 4
				tasks: Array[3] - is there a differnt way to do this... maybe store a single array on the group
				tid: "task4"

		*/

		var LoadTask = MonkeyBars.Task.extend({
			performTask:function(){
				this.complete();
			}
		});

		var LoadGroupTask = MonkeyBars.ParallelTask.extend();

		var group = new MonkeyBars.SequenceTask({
			onComplete:function(){
				console.log(this);
			}
		});

		var tasks = [];
		for(var i = 0;i<2000;i++) {
			// if(i != 1) {
				tasks.push(new LoadTask());
			// }else {
			// 	tasks.push(new LoadTask({
			// 		performTask:function(){}
			// 	}));
			// }
			/*
			tasks.push(new LoadGroupTask({
				tasks:[new LoadTask(),new LoadTask(),new LoadTask()]
			}));
			*/	
		}
		group.tasks = tasks;
		group.start();
		console.log(group);
	});

});