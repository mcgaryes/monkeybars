# MonkeyBars

A task based library that provides a simple structure for handling singular, sequential and parallel units of code. 

The overall architecture is based off of the [composite](http://en.m.wikipedia.org/wiki/Composite%20pattern) and [decorator](http://en.wikipedia.org/wiki/Decorator_pattern) patterns. These patterns lend themselves very well to a task based library, where tasks can contain other tasks all contributing to the overall flow of an operation.

### Implementation

<pre>
var task = new MonkeyBars.Task({
    name:"SimpleTask",
    loggingEnabled:true,
    onChange:function(state,error){
        if(state == MonkeyBars.TaskStates.Completed) {
            alert("The 'SimpleTask' is complete");
        }
    },
    performTask:function(){
        this.complete();
    }
});

task.start();
</pre>

### Documentation

Full documentation can be seen from within the [docs](https://github.com/mcgaryes/monkeybars/tree/master/docs) directory of this project.

### Nesting

All tasks have the ability to have sub tasks nested within them, turning them into task groups. By default nested tasks run sequentially, unless otherwise specified. Currently the two types of task groups available are `sequence` and `parallel`. 

Sequential tasks run sub tasks one after another until all sub tasks complete. When all nested sub tasks are complete the `complete` state is passed to the task groups `change` method for handling.

Parallel tasks are task groups who's nested subtasks are executed side by side, executing whenever they can. Just like the sequential task group, when all sub tasks have completed the groups `change` method will be notified.

### Examples

Examples for the library can be found in the [examples](https://github.com/mcgaryes/monkeybars/tree/master/examples) directory of this project.
