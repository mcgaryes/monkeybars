/**
 * A ParallelTask is a TaskGroup that runs all of its subtasks ansynchronously. Its
 * complete functionality is run when all of its sub tasks are complete.
 * @extends TaskGroup
 * @constructor
 * @class ParallelTask
 * @param {Object} attributes List of attributes to apply to the task group
 * @example
 *	var parallel = new MonkeyBars.ParallelTask({
 *		name:"ParallelTask",
 *		tasks:[new MonkeyBars.Task({
 *			performTask:function(){
 *				this.complete();
 *			}
 *		})],
 *		onComplete:function(){
 *			alert(this.name + " is complete!");
 *		}
 *	});
 *	parallel.start();
 */
var ParallelTask = MonkeyBars.ParallelTask = function(attributes) {
	var task = this;
	TaskGroup.call(task, attributes);
};

ParallelTask.prototype = Object.create(TaskGroup.prototype, {
	
	// ===================================================================
	// === ParallelTask Public Properties ================================
	// ===================================================================
	
	/**
	 * The kind of task
	 * @for ParallelTask
	 * @property type
	 * @type String
	 * @readonly
	 */
	type: {
		value: TYPE_PARALLEL
	},

	// ===================================================================
	// === ParallelTask Methods ==========================================
	// ===================================================================

	/**
	 * This method is overridden from `TaskGroups` implementation because of the
	 * nature of a parallel task. When a task is added it should be immediately
	 * processed and started.
	 * @for ParallelTask
	 * @method addSubTask
	 * @param {Object} task Either an object containing attributes of a task or
	 */
	addSubTask: {
		value: function(task) {
			if(!task || task._state === STATE_CANCELED) {
				return;
			}
			if(!task.tid) {
				task = createTaskWithOptions(task);
			}
			this.tasks.push(task);
			if(this._state >= STATE_STARTED){
				this.processSubTask(task);
			}
		}
	},

	/**
	 * @for ParallelTask
	 * @method canProcessSubTask
	 * @return {Boolean} Whether or not the task can process
	 */
	canProcessSubTask:{
		value:function(task){
			if(!task.dependencies) {
				return true;
			}
			var totalDependencies = task.dependencies.length;
			var canProcess = totalDependencies;
			var processCount = 0;
			var dependencyNames = [];
			var dependencies = [];
			for(var i = 0; i < totalDependencies; i++) {
				var dependency = task.dependencies[i];
				
				if(dependency._state > STATE_STARTED) {
					processCount++;
				} else {
					dependencies.push(dependency);
					dependencyNames.push(dependency.displayName);
				}
			}
			if(processCount < canProcess) {
				if(this.logLevel >= LOG_VERBOSE) {
					log("Cannot process " + task.displayName + " until its dependencies [" + dependencyNames.join(",") + "] have run");
				}
				var completion = function(e){
					e.target.off("complete",completion);
					this.processSubTask(task);
				};
				for (var j = 0; j < dependencies.length; j++) {
					var t = dependencies[j];
					t.on("complete",completion,this,false);
				}
				return false;
			}
			return true;
		}
	},

	/**
	 * Checks whether or not the group has any enabled sub tasks.
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
				if(task._state !== STATE_CANCELED) {
					return false;
				}
			}
			return true;
		}
	},

	/**
	 * Overridden from TaskGroup. This method is run everytime a sub task
	 * completes. When all subtasks are complete the groups complete method
	 * is called.
	 * @for ParallelTask
	 * @method onSubTaskComplete
	 * @param {Task} task
	 */
	onSubTaskComplete: {
		value: function(task) {
			this._currentIndex++;
			TaskGroup.prototype.onSubTaskComplete.call(this, task);
			if(this._currentIndex === this.tasks.length) {
				this.complete();
			}
		}
	},

	/**
	 * Overridden from Task. First checks to see if there are any enabled
	 * subtasks to process. If there arent the groups complete method is called.
	 * If there are then the group processes all of the sub tasks it has.
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
		}
	},

	/**
	 * Overridden from TaskGroup. Processes a sub task and prepares it for execution. This method overwrites the
	 * tasks on change functionality. If you wish to have a sub task that handles
	 * its own change functionality then you will need to implement the partner
	 * convenience methods.
	 * @for ParallelTask
	 * @method processSubTask
	 * @param {Task} task Subtask to process
	 */
	processSubTask: {
		value: function(task) {
			if(this.canProcessSubTask(task)) {
				TaskGroup.prototype.processSubTask.call(this, task);
			}
		}
	},

	/**
	 * Processes all of the sub tasks available for the group
	 * @for ParallelTask
	 * @method processSubTasks
	 */
	processSubTasks: {
		value: function() {
			for(var i = 0;i<this.tasks.length;i++) {
				var task = this.tasks[i];
				if(task !== undefined && !task.processed) {
					this.processSubTask(task);
				}
			}
		}
	}
});

ParallelTask.extend = extend;