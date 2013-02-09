/**
 * A SequenceTask is a TaskGroup that runs all of its subtasks serially. Its
 * complete functionality is run when all of its sub tasks are complete.
 * @extends TaskGroup
 * @constructor
 * @class SequenceTask
 * @param {Object} attributes List of attributes to apply to the task group
 * @example
 *	var sequence = new MonkeyBars.SequenceTask({
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
 *	sequence.start();
 */
var SequenceTask = MonkeyBars.SequenceTask = function(attributes) {
	var task = this;
	TaskGroup.call(task, attributes);
};

SequenceTask.prototype = Object.create(TaskGroup.prototype, {
	
	// ===================================================================
	// === SequenceTask Public Properties ================================
	// ===================================================================

	/**
	 * The kind of task
	 * @for SequenceTask
	 * @property type
	 * @type String
	 * @readonly
	 */
	type: {
		value: TYPE_SEQUENCE
	},

	// ===================================================================
	// === SequenceTask Methods ==========================================
	// ===================================================================

	/**
	 * Overriden from TaskGroup. As long as the group has not been canceled,
	 * when a sub task is canceled it simply moves on to the next task in the queue.
	 * @for SequenceTask
	 * @method onSubTaskCancel
	 * @param {Task} task
	 */
	onSubTaskCancel: {
		value: function(task) {
			TaskGroup.prototype.onSubTaskCancel.call(this, task);
			if(this._state !== STATE_CANCELED) {
				this.startNextSubTask();
			}
		},
		writable:true
	},
	
	/**
	 * Overridden from TaskGroup. As long as the group has not been canceled,
	 * when a sub task completes it starts the next sibling in the queue.
	 * @for SequenceTask
	 * @method onSubTaskComplete
	 * @param {Task} task
	 */
	onSubTaskComplete: {
		value: function(task) {
			if(this._state === STATE_CANCELED) {
				return;
			}
			// @TODO: there has got to be a better way of doing this
			var delegate = this;
			setTimeout(function(){ 
				TaskGroup.prototype.onSubTaskComplete.call(this, task);
				delegate.startNextSubTask(); 
			},0);
		},
		writable:true
	},

	/**
	 * Starts the next sub task in the sequence. If overriden you need to call the
	 * SequenceTask's prototype `performTask` method.
	 * @for SequenceTask
	 * @method performTask
	 * @param {Task} task
	 */
	performTask: {
		value: function() {
			this.startNextSubTask();
		},
		writable:true
	},
	
	/**
	 * Starts the next task in the queue after its previous sibling has completed.
	 * @for SequenceTask
	 * @method startNextSubTask
	 */
	startNextSubTask: {
		value: function() {
			if(this._state >= STATE_CANCELED) {
				return;
			}
			if(this.tasks && this._currentIndex < this.tasks.length) {
				var task = this.tasks[this._currentIndex++];
				var skipped = this.processSubTask(task);
				if(skipped) {
					if(this.logLevel >= LOG_INFO) {
						log("Skipped: " + task.displayName + " Group: " + this.displayName);
					}
					this.startNextSubTask();
				}
			} else {
				this.complete();
			}
		}
	}
});

SequenceTask.extend = extend;