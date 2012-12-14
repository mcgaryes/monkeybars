# monkey bars

This is a library that provides a simple structure for handling singular, sequential and parallel units of code. The overall architecture is based off of the [composite pattern](http://en.m.wikipedia.org/wiki/Composite%20pattern).

>*In software engineering, the composite pattern is a partitioning design pattern. The composite pattern describes that a group of objects are to be treated in the same way as a single instance of an object. The intent of a composite is to "compose" objects into tree structures to represent part-whole hierarchies. Implementing the composite pattern lets clients treat individual objects and compositions uniformly.*

This pattern lends itself very well to a task based library, where tasks can contain other tasks all contributing to the overall flow of an operation.

Perform state specific functionality during the execution cycle of a task through the `onChange` method. Nest tasks as deep as you'd like to perform a specific action and manipulate a data set throughout. 

### Implementation

<pre>
var task = MonkeyBars.Task.extend({
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

### Nesting

All tasks have the ability to have sub tasks nested within them, turning them into task groups. By default nested tasks run sequentially, unless otherwise specified. Currently the two types of task groups available are `sequence` and `parallel`. 

Sequential tasks run sub tasks one after another until all sub tasks complete. When all nested sub tasks are complete the `complete` state is passed to the task groups `change` method for handling.

Parallel tasks are task groups who's nested subtasks are executed side by side, executing whenever they can. Just like the sequential task group, when all sub tasks have completed the groups `change` method will be notified.

### Examples

There are number examples to illustrate usage. Be sure to open the console as there is some logging happening.

* [Simple](http://sandbox.ericmcgary.com/monkeybars/simple.html)
* [Parallel](http://sandbox.ericmcgary.com/monkeybars/parallel.html)
* [Sequence](http://sandbox.ericmcgary.com/monkeybars/sequence.html)
* [Complex](http://sandbox.ericmcgary.com/monkeybars/complex.html) 
