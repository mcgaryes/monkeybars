define(["monkeybars"], function(MonkeyBars) {

    'use strict';

    return MonkeyBars.Task.extend({
        name: "task1",
        performTask: function() {
            var delegate = this;
            setTimeout(function(){
                delegate.complete(delegate.displayName);
            },1000);
        }
    });

});