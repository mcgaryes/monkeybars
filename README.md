# MonkeyBars

A task based library that provides a simple structure for handling singular, sequential and parallel units of code. 

The overall architecture is based off of the [composite](http://en.m.wikipedia.org/wiki/Composite%20pattern) and [decorator](http://en.wikipedia.org/wiki/Decorator_pattern) patterns. These patterns lend themselves very well to a task based library, where tasks can contain other tasks all contributing to the overall flow of an operation.

### Installation

The library itself has no ties to the browser, and because of this it works both in client side & server side javascript projects. Include *monkeybars.min.js* for your client side projects or install using [npm](https://npmjs.org/package/monkeybars) by running the following command from within your project:

<pre>
$ npm install monkeybars [-g]
</pre>

### Implementation

##### Simple Task

`Monkeybars.Task` is the simplest form of a task possible. You can override any of the methods provided (granted you must then call the prototype version of the method), but in its simplest form a task only requires the `performTask` method to be present. For a list of all possible methods and properties available have a look at the [documentation](https://github.com/mcgaryes/monkeybars/tree/master/docs).

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

##### Task Groups

Task groups are a great way to contain and structure both serial and async units of code. There are numerous syntax variations that you can use in order to create and add subtasks to a task group. Have a look at the group, parallel and sequence specs within the [tests](https://github.com/mcgaryes/monkeybars/tree/master/tests/specs) directory for all of the possible variations.

<pre>

    var group = new MonkeyBars.SequenceTask({
        name:"SimpleTask",
        loggingEnabled:true,
        tasks:[{
            name:"subtask1",
            performTask:function(){
                // run task functionality
                this.complete();
            }
        },
        {
            name:"subtask2",
            performTask:function(){
                // run task functionality
                this.complete();
            }
        }]
    });

    group.start();

</pre>

##### Extending

In some cases you may have a need for more specific functionality then what is provided with the simple, parallel and sequence task types. It is very simple to extend the base functionality of a specific task type to bake your own.

<pre>

    var MyCustomGroupTask = MonkeyBars.TaskGroup.extend({
        type:"MyCustomGroupTask",
        start:function(){
            this.customFunction();
            MonkeyBars.TaskGroup.prototype.start.call(this);
        },
        customFunction:function(){
            // custom logic
        }
    });

    var group = new MyCustomTaskGroup({
        name:"group",
        tasks:[...]
    });

    group.start(); 

</pre>

### Documentation

Full documentation can be seen from within the [docs](https://github.com/mcgaryes/monkeybars/tree/master/docs) directory of this project.

### Nesting

As stated above the tasks within the library implement the composite design pattern, this simply means that all groups of tasks are themselves tasks. Tasks have the ability to have sub tasks nested within them, turning them into task groups. By default nested tasks run sequentially, unless otherwise specified. Currently the two types of task groups available are `sequence` and `parallel` (implementation examples above). 

Sequential tasks run sub tasks one after another until all sub tasks complete. When all nested sub tasks are complete the `complete` state is passed to the task groups `change` method for handling.

Parallel tasks are task groups who's nested subtasks are executed side by side, executing whenever they can. Just like the sequential task group, when all sub tasks have completed the groups `change` method will be notified.

There is **no** limit to the depth of which you nest tasks, which is where the power of the library starts to become apparent. You can view a more complex example of this in the [complex](https://github.com/mcgaryes/monkeybars/blob/master/examples/complex.html) example within the examples directory.

### Examples

Examples for the library can be found in the [examples](https://github.com/mcgaryes/monkeybars/tree/master/examples) directory of this project.
