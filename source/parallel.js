/**
 * A ParallelTask is a TaskGroup that runs all of its subtasks ansynchronously. Its
 * complete functionality is run when all of its sub tasks are complete.
 *
 * @extends TaskGroup
 * @constructor
 * @class ParallelTask
 * @param {Object} attributes List of attributes to apply to the task group
 * @example
 *
 *		var parallel = new MonkeyBars.ParallelTask({
 *			name:"ParallelTask",
 *			tasks:[new MonkeyBars.Task({
 *				performTask:function(){
 *					this.complete();
 *				}
 *			})],
 *			onComplete:function(){
 *				alert(this.name + " is complete!");
 *			}
 *		});
 *
 *		parallel.start();
 *
 */
var ParallelTask = MonkeyBars.ParallelTask = function(attributes) {
	var task = this;
	TaskGroup.call(task, attributes);
};

ParallelTask.prototype = Object.create(TaskGroup.prototype, {

	/**
	 * The kind of task
	 *
	 * @for ParallelTask
	 * @property type
	 * @type String
	 * @readonly
	 */
	type: {
		value: TYPE_PARALLEL,
		writable: true
	},

	/**
	 * The max amounts of tasks that can run simultaneously
	 *
	 * @for ParallelTask
	 * @property max
	 * @type Integer
	 */
	max: {
		value: 0,
		writable: true
	},

	/**
	 * Checks whether or not the group has any enabled sub tasks.
	 *
	 * @for ParallelTask
	 * @method hasNoEnabledSubTasks
	 * @return {Boolean} Has sub tasks or not
	 */
	hasNoEnabledSubTasks: {
		value: function() {
			if(!this.tasks) {
				return true;
			}
			for(var i = 0; i < this.tasks.length; i++) {
				var task = this.tasks[i];
				if(task.state !== STATE_CANCELED) {
					return false;
				}
			}
			return true;
		},
		writable: true
	},

	/**
	 * Overridden from TaskGroup. Processes a sub task and prepares it for execution. This method overwrites the
	 * tasks on change functionality. If you wish to have a sub task that handles
	 * its own change functionality then you will need to implement the partner
	 * convenience methods.
	 *
	 * @for ParallelTask
	 * @method processSubTask
	 * @param {Task} task Subtask to process
	 */
	processSubTask: {
		value: function(task) {
			if(task !== undefined && task.dependencies !== undefined) {
				var totalDependencies = task.dependencies.length;
				var canProcess = totalDependencies;
				var processCount = 0;
				var dependencyNames = [];
				for(var i = 0; i < totalDependencies; i++) {
					var dependency = task.dependencies[i];
					dependencyNames.push(dependency.displayName);
					if(dependency.state > STATE_STARTED) {
						processCount++;
					}
				}
				if(processCount < canProcess) {
					if(this.logLevel >= LOG_VERBOSE) {
						console.log("Cannot process " + task.displayName + " until its dependencies [" + dependencyNames.join(",") + "] have run");
					}
					return;
				}
			}
			TaskGroup.prototype.processSubTask.call(this, task);
		},
		writable: true
	},

	/**
	 * Processes all of the sub tasks available for the group
	 *
	 * @for ParallelTask
	 * @method processSubTasks
	 */
	processSubTasks: {
		value: function() {
			var processTotal = this.max === 0 ? this.tasks.length : this.max;
			for(var i = 0; i < processTotal; i++) {
				var task = this.tasks[i];
				if(!task.processed) {
					this.processSubTask(task);
				}
			}
		},
		writable: true
	},

	/**
	 * This method is overridden from `TaskGroups` implementation because of the
	 * nature of a parallel task. When a task is added it should be immediately
	 * processed and started.
	 *
	 * @for ParallelTask
	 * @method addSubTask
	 * @param {Object} task Either an object containing attributes of a task or
	 */
	addSubTask: {
		value: function(task) {
			if(!task || task.state === STATE_CANCELED) {
				return;
			}
			this.currentIndex++;
			if(!task.tid) {
				task = createTaskWithOptions(task);
			}
			this.tasks.push(task);
			this.processSubTask(task);
		},
		writable: true
	},

	/**
	 * Overridden from TaskGroup. This method is run everytime a sub task
	 * completes. When all subtasks are complete the groups complete method
	 * is called.
	 *
	 * @for ParallelTask
	 * @method onSubTaskComplete
	 * @param {Task} task
	 * @param {Object} data
	 */
	onSubTaskComplete: {
		value: function(task, data) {
			this.currentIndex++;
			if(this.currentIndex === this.tasks.length) {


				///*
				if(this.group !== undefined) {
					this.complete(this.data);
				} else {
					this.complete();
				}
				//*/
				// this.complete(this.data);


			} else {
				TaskGroup.prototype.onSubTaskComplete.call(this, task, data);
				this.processSubTasks();
			}
		},
		writable: true
	},

	/**
	 * Overridden from Task. First checks to see if there are any enabled
	 * subtasks to process. If there arent the groups complete method is called.
	 * If there are then the group processes all of the sub tasks it has.
	 *
	 * @for ParallelTask
	 * @method performTask
	 */
	performTask: {
		value: function() {
			if(this.hasNoEnabledSubTasks()) {
				this.complete();
			} else {
				this.processSubTasks();
			}
		},
		writable: true
	}
});

ParallelTask.extend = extend;