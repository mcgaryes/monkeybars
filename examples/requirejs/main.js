// requirejs config
require.config({
  deps: ["main"],
  paths: {
    monkeybars: "../../monkeybars.min",
  },
  shim: {
    monkeybars: {
      exports: "MonkeyBars"
    }
  }
});

// main require
require(["monkeybars"], function(MonkeyBars) {

  'use strict';

  var task = new MonkeyBars.Task({
  	logLevel:MonkeyBars.LogLevels.Verbose,
  	performTask:function(){
  		this.complete();
  	}
  });

  task.start();

});