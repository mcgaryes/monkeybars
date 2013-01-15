/**
 * A task group, and extention of task, provides the building blocks for creating
 * a group of tasks that is inherently a task itself.
 *
 * @extends Task
 * @constructor
 * @class TaskGroup
 * @param {Object} attributes List of attributes to apply to the task group
 */
var TaskGroup = MonkeyBars.TaskGroup = function(attributes) {
	var task = this;

	if(attributes) {
		task.tasks = createSubTasksFromTaskOptionsArray(attributes.tasks);
	}

	// create dependency map and populate it with subtask tids
	task.dependencyMap = {};
	if(task.tasks) {
		for(var i = 0; i < task.tasks.length; i++) {
			var subtask = task.tasks[i];
			this.dependencyMap[subtask.tid] = [];
			task.setDependeciesForTask(subtask);
		}
	}

	// super
	Task.call(task, attributes);
};

TaskGroup.prototype = Object.create(Task.prototype, {

	/**
	 * Adds a subtask to the groups queue. This is helpful when you want to add
	 * a sub task after instantiation.
	 *
	 * @for TaskGroup
	 * @method addSubTask
	 * @param {Object} task Either an object containing attributes of a task or
	 * an already instantiated task
	 * @example
	 *
	 *	var parallel = new MonkeyBars.ParallelTask();
	 *	
	 *	parallel.addSubTask({
	 *		name:"subtask",
	 *		performTask:function(){
	 *			this.complete();
	 *		}
	 *	});
	 *
	 *	var simple = new MonkeyBars.simple({
	 *		name:"subtask",
	 *		performTask:function(){
	 *			this.complete();
	 *		}
	 *	});
	 *
	 *	parallel.addSubTask(simple);
	 *
	 */
	addSubTask: {
		value: function(task) {
			if(!task) {
				throw "addSubTask: " + INVALID_ARGUMENTS;
			}
			if(!task.tid) {
				task = createTaskWithOptions(task);
			}
			this.setDependeciesForTask(task);
			this.tasks.push(task);
		},
		writable: true
	},

	/**
	 * Adds a subtask after another task
	 *
	 * @for TaskGroup
	 * @method addSubTaskAfterTask
	 * @param {Object} task Either an object containing attributes of a task or
	 * @param {Object} afterTask Reference to an already added task
	 * @example
	 *
	 *	var parallel = new MonkeyBars.ParallelTask({
	 *		tasks:[task1,task3]
	 *	});
	 *
	 *	var task2 = new MonkeyBars.Task();
	 *	parallel.addTaskAfterTask(task2,task1);
	 *
	 */
	addSubTaskAfterTask: {
		value: function(task, afterTask) {
			if(!task || !afterTask) {
				throw "addSubTaskAfterTask: " + INVALID_ARGUMENTS;
			}
			if(!task || this.state === STATE_CANCELED) {
				return;
			}
			if(!task.tid) {
				task = createTaskWithOptions(task);
			}
			this.setDependeciesForTask(task);
			var index = this.tasks.indexOf(afterTask);
			this.tasks.splice(index + 1, 0, task);
		},
		writable: true
	},

	/**
	 * Very similar to `addSubTaskAfterTask` except the inject task appears
	 * before the second arguments position.
	 *
	 * @for TaskGroup
	 * @method addSubTaskBeforeTask
	 * @param {Object} task Either an object containing attributes of a task or
	 * @param {Object} beforeTask Reference to an already added task
	 */
	addSubTaskBeforeTask: {
		value: function(task, beforeTask) {
			if(!task || !beforeTask) {
				throw "addSubTaskBeforeTask: " + INVALID_ARGUMENTS;
			}
			if(!task || this.state === STATE_CANCELED) {
				return;
			}
			if(!task.tid) {
				task = createTaskWithOptions(task);
			}
			this.setDependeciesForTask(task);
			var index = this.tasks.indexOf(beforeTask);
			this.tasks.splice(index, 0, task);
		},
		writable: true
	},

	/**
	 * Cancel the group and cancel all of its subtasks
	 *
	 * @for TaskGroup
	 * @method cancel
	 */
	cancel: {
		value: function() {

			// call cancel on this task
			Task.prototype.cancel.call(this);

			// cancel all of this tasks subtasks
			for(var i = 0; i < this.tasks.length; i++) {
				// we only want to cancel those tasks that are currently running
				// otherwise we want to set the canceled flag
				var task = this.tasks[i];
				if(task.state > STATE_INITIALIZED) {
					task.cancel();
				} else {
					task.state = STATE_CANCELED;
				}
			}
		},
		writable: true
	},

	/**
	 * The index of the subtasks that have completed execution.
	 *
	 * @for Task
	 * @property currentIndex
	 * @type Integer
	 * @readonly
	 * @default 0
	 */
	currentIndex: {
		value: 0,
		writable: true
	},

	/**
	 * Return a Task object, if it exists, based on the `id` passed.
	 *
	 * @for TaskGroup
	 * @method getTaskById
	 * @param {String} id The user defined id
	 */
	getTaskById: {
		value: function(id) {
			for(var i = 0; i < this.tasks.length; i++) {
				var task = this.tasks[i];
				if(task.id === id) {
					return task;
				}
			}
		},
		writable: true
	},

	/**
	 * Return a Task object, if it exists, based on the `name` passed.
	 *
	 * @for TaskGroup
	 * @method getTaskByName
	 * @param {String} name The user defined name
	 */
	getTaskByName: {
		value: function(name) {
			for(var i = 0; i < this.tasks.length; i++) {
				var task = this.tasks[i];
				if(task.name === name) {
					return task;
				}
			}
		},
		writable: true
	},

	/**
	 * Return a Task object, if it exists, based on the `tid` passed.
	 *
	 * @for TaskGroup
	 * @method getTaskByTid
	 * @param {String} tid The id of the task you want
	 * @example
	 *
	 *	var parallel = new MonkeyBars.ParallelTask({
	 *		tasks:[task1,task3]
	 *	});
	 *
	 *	parallel.getTaskByTid(task1.tid);
	 *
	 */
	getTaskByTid: {
		value: function(tid) {
			for(var i = 0; i < this.tasks.length; i++) {
				var task = this.tasks[i];
				if(task.tid === tid) {
					return task;
				}
			}
		},
		writable: true
	},

	/**
	 * Called when a subtask calls its cancel method. When a subtask is canceled
	 * any other subtasks that are dependent on the canceled task are cancled.
	 *
	 * @for TaskGroup
	 * @method onSubTaskCancel
	 * @param {Task} task The task that was just canceled
	 */
	onSubTaskCancel: {
		value: function(task) {
			for(var i = 0; i < this.tasks.length; i++) {
				if(isTaskDependentOnTask(this.tasks[i], task)) {
					this.tasks[i].state = STATE_CANCELED;
				}
			}
		},
		writable: true
	},

	/**
	 * Called when a sub task completes. Must be overridden with functionality
	 * provided by the extending class.
	 *
	 * @for TaskGroup
	 * @method onSubTaskComplete
	 * @param {Task} task The task that just completed
	 * @param {Object} data
	 */
	onSubTaskComplete: {
		value: function(task, data) {
			if(data !== undefined) {
				this.handleData(data);
			}
		},
		writable: true
	},

	/**
	 * Called when a subtask calls its fault method.
	 *
	 * @for TaskGroup
	 * @method onSubTaskFault
	 * @param {String} error Error message.
	 * @param {Task} task The task that just completed
	 */
	onSubTaskFault: {
		value: function(task, error) {
			this.fault(error);
		},
		writable: true
	},

	/**
	 * An incrimented number of the tasks that have already been processed.
	 *
	 * @for ParallelTask
	 * @property processedIndex
	 * @type Integer
	 */
	processedIndex: {
		value: 0,
		writable: true
	},

	/**
	 * Processes a sub task and prepares it for execution. This method overwrites the
	 * tasks on change functionality. If you wish to have a sub task that handles
	 * its own change functionality then you will need to implement the partner
	 * convenience methods.
	 *
	 * @for TaskGroup
	 * @method processSubTask
	 * @param {Task} task Subtask to process
	 */
	processSubTask: {
		value: function(task) {

			if(!task) {
				if(this.logLevel >= LOG_ERROR) {
					console.log(UNDEFINED_TASK);
				}
				return;
			}

			if(task.state === STATE_CANCELED) {
				this.onSubTaskCancel(task);
				return true;
			}

			this.processedIndex++;

			task.group = this;
			task.data = this.data;
			task.concurrent = this.concurrent;
			task.processed = true;
			task.logLevel = this.logLevel;

			// set execution block
			task.onChange = function(state, data, error) {
				if(state === STATE_COMPLETED) {
					this.group.onSubTaskComplete(this, data);
				} else if(state === STATE_FAULTED) {
					this.group.onSubTaskFault(this, undefined, error);
				} else if(state === STATE_CANCELED) {
					this.group.onSubTaskCancel(this);
				}
			};

			task.start();

			return false;
		},
		writable: true
	},

	/**
	 * Removes a task from its group. Removing the task after it has executed will
	 * have no apparent affect as it has already ran.
	 *
	 * @for TaskGroup
	 * @method removeSubTask
	 * @param {Task} task The task you wish to remove from the group.
	 */
	removeSubTask: {
		value: function(task) {
			if(!task) {
				return;
			}
			var index = this.tasks.indexOf(task);
			this.tasks.splice(index, 1);
		},
		writable: true
	},

	/**
	 * Resets a task to its original state
	 *
	 * @for Task
	 * @method reset
	 */
	reset:{
		value:function(){
			if(this.tasks) {
				this.currentIndex = 0;
				this.processedIndex = 0;
				for(var i = 0; i < this.tasks.length; i++) {
					this.tasks[i].reset();
				}
			}
			Task.prototype.reset.call(this);
		}
	},

	/**
	 * Sets dependencies for the passed task.
	 *
	 * @method setDependeciesForTask
	 * @param {Task} task
	 * @static
	 */
	setDependeciesForTask: {
		value: function(task) {
			if(task.dependencies) {
				var totalDependencies = task.dependencies.length;
				for(var i = 0; i < totalDependencies; i++) {
					var dependency = task.dependencies[i];
					if(dependency.tid) {
						this.dependencyMap[task.tid].push(dependency.tid);
					} else {
						this.dependencyMap[task.tid].push(dependency);
					}
				}

			}
		},
		writable: false
	}
});

TaskGroup.extend = extend;