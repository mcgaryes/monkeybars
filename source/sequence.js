	/**
	 * A SequenceTask is a TaskGroup that runs all of its subtasks serially. Its
	 * complete functionality is run when all of its sub tasks are complete.
	 *
	 * @extends TaskGroup
	 * @constructor
	 * @class SequenceTask
	 * @param {Object} attributes List of attributes to apply to the task group
	 * @example

			var sequence = new MonkeyBars.SequenceTask({
				name:"ParallelTask",
				tasks:[new MonkeyBars.Task({
					performTask:function(){
						this.complete();
					}
				})],
				onComplete:function(){
					alert(this.name + " is complete!");
				}
			});

			sequence.start();

	 */
	var SequenceTask = MonkeyBars.SequenceTask = function(attributes) {
			var task = this;
			TaskGroup.call(task, attributes);
		};

	SequenceTask.prototype = Object.create(TaskGroup.prototype, {

		/**
		 * The kind of task
		 *
		 * @for SequenceTask
		 * @property type
		 * @type String
		 * @readonly
		 */
		type: {
			value: TYPE_SEQUENCE,
			writable: true
		},

		/**
		 * Starts the next task in the queue after its previous sibling has completed.
		 *
		 * @for SequenceTask
		 * @method startNextSubTask
		 */
		startNextSubTask: {
			value: function() {
				if(this.state >= STATE_CANCELED) {
					return;
				}
				if(this.tasks && this.currentIndex < this.tasks.length) {
					var task = this.tasks[this.currentIndex++];
					var skipped = this.processSubTask(task);
					if(skipped) {
						if(this.logLevel >= LOG_INFO) {
							console.log("Skipped: " + task.displayName + " Group: " + this.displayName);
						}
						this.startNextSubTask();
					}
				} else {


					///*
					if(this.group !== undefined) {
						this.complete(this.data);
					} else {
						this.complete();
					}
					//*/
					// this.complete(this.data);


				}
			},
			writable: true
		},

		/**
		 * Overridden from TaskGroup. As long as the group has not been canceled,
		 * when a sub task completes it starts the next sibling in the queue.
		 *
		 * @for SequenceTask
		 * @method onSubTaskComplete
		 * @param {Task} task
		 * @param {Object} data
		 */
		onSubTaskComplete: {
			value: function(task, data) {
				if(this.state === STATE_CANCELED) {
					return;
				}
				TaskGroup.prototype.onSubTaskComplete.call(this, task, data);
				this.startNextSubTask();
			},
			writable: true
		},

		/**
		 * Overriden from TaskGroup. As long as the group has not been canceled,
		 * when a sub task is canceled it simply moves on to the next task in the queue.
		 *
		 * @for SequenceTask
		 * @method onSubTaskCancel
		 * @param {Task} task
		 */
		onSubTaskCancel: {
			value: function(task) {
				TaskGroup.prototype.onSubTaskCancel.call(this, task);
				if(this.state !== STATE_CANCELED) {
					this.startNextSubTask();
				}
			},
			writable: true
		},

		/**
		 * Starts the next sub task in the sequence. If overriden you need to call the
		 * SequenceTask's prototype `performTask` method.
		 *
		 * @for SequenceTask
		 * @method performTask
		 * @param {Task} task
		 */
		performTask: {
			value: function() {
				this.startNextSubTask();
			},
			writable: true
		}
	});

	SequenceTask.extend = extend;