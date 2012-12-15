function start(e){
	$("#log").html("");
			this.execute();
		}

		function stop(e){
			task.cancel();
		}

		function append(label,name){
			$("#log").append("<p>" + "<span class='label'>" + label + ":</span> " + name + "</p>");
		}

		function performTaskFunx(){
			var task = this;
			append("start",task.name);
			var timeout = setTimeout(function(){
				append("complete",task.name);
				task.complete();
			},Math.round(Math.random()*3000));
		}

		function onChangeFunx(state,error){
			if(state == MonkeyBars.TaskStates.Started) {
				append("start",task.name);
			}else if (state == MonkeyBars.TaskStates.Completed) {
				append("complete",task.name);
			}
		}