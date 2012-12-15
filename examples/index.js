function start(e){
	$("#log").html("");
	this.execute();
}

function stop(e){
	task.cancel();
}

function append(label,name,time){
	if(time){
		$("#log").append("<p><span class='" + label + "'>" + label + ":</span> " + name + " in " + time + "ms</p>");
	}else{
		$("#log").append("<p><span class='" + label + "'>" + label + ":</span> " + name + "</p>");
	}
}

function performTaskFunx(){
	var task = this;
	append("Started",task.name);
	var timeout = setTimeout(function(){
		task.complete();
		append("Completed",task.name,task.executionTime);
	},Math.round(Math.random()*3000));
}

function onChangeFunx(state,error){
	if(state == MonkeyBars.TaskStates.Started) {
		append("start",this.name);
	}else if (state == MonkeyBars.TaskStates.Completed) {
		append("complete",this.name,this.executionTime);
	}
}