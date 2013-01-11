/*global MonkeyBars:false, $:false*/

"use strict";

function execute(e) {

	// defaults
	var uid = 20;

	// bootstrap data task
	var GetBootstrapDataTask = MonkeyBars.Task.extend({
		name: "GetBootstrapDataTask",
		performTask: function() {
			var delegate = this;
			$.getJSON('bootstrap.json', function(data) {
				console.log(data);
				delegate.complete(data);
			});
		},
		onComplete: function(product) {
			// need to be able to access product here... for some reason its undefined
			console.log(product);
			//$("#content").append("<p>bootstrap data loaded</p>");
		}
	});

	// get user info task
	var GetUserDataTask = MonkeyBars.Task.extend({
		name: "GetUserDataTask",
		initialize: function(options) {
			if(options.uid === undefined) {
				this.state = MonkeyBars.TaskStates.Canceled;
			}
		},
		performTask: function() {
			var delegate = this;
			$.getJSON('user.json', function(data) {
				if(true) {
					delegate.group.addSubTaskAfterTask(new GetUserItemTask({
						// ...
					}), delegate);
				}
				$("#content").append("<p>user data loaded</p>");
				delegate.complete();
			});
		}
	});

	// get user item task
	var GetUserItemTask = MonkeyBars.Task.extend({
		name: "GetUserItemTask",
		performTask: function() {
			var delegate = this;
			$.getJSON('item.json', function(data) {
				$("#content").append("<p>user item loaded</p>");
				delegate.complete();
			});
		}
	});

	var buildApplicationTask = new MonkeyBars.Task({
		name: "BuildApplicationTask",
		performTask: function() {
			this.complete();
		}
	});

	// startup sequence
	var startupTask = new MonkeyBars.SequenceTask({
		name: "StartUpTask",
		logLevel: 1000,
		tasks: [{
			type: MonkeyBars.TaskTypes.Parallel,
			tasks: [
			new GetBootstrapDataTask(), // grabs bootstrap data
			new GetUserDataTask({
				uid: uid
			}) // grabs user data if it can
			]
		},
		buildApplicationTask],
		onStart: function() {
			$("#loader").html("Loading...");
		},
		onComplete: function() {
			$("#loader").remove();
			console.log("handle completion");
		}
	});

	startupTask.start();

}