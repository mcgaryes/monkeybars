// requirejs config
require.config({
    deps: ["main"],
    paths: {
        monkeybars: "../../monkeybars",
    },
    shim: {
        monkeybars: {
            exports: "MonkeyBars"
        }
    }
});

// main require
require(["group_task"], function(GroupTask) {

    'use strict';

    var groupTask = new GroupTask({
        logLevel:1000,
        onComplete: function() {
            console.log(this.data); // should equal ["task1","task2","task3"] after 1 second timeout
        }
    });

    groupTask.start();

});