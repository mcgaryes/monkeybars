# Task Library

This library provides a simple interface for handling singular, sequential and parallel units of code. The overall architecture is based off of the [compisite pattern](http://en.m.wikipedia.org/wiki/Composite%20pattern).

>*In software engineering, the composite pattern is a partitioning design pattern. The composite pattern describes that a group of objects are to be treated in the same way as a single instance of an object. The intent of a composite is to "compose" objects into tree structures to represent part-whole hierarchies. Implementing the composite pattern lets clients treat individual objects and compositions uniformly.*

This pattern lends itself very well to a task based library, where tasks can contain other tasks all contributing to the overall flow of an operation.

Perform state specific functionality during the execution cycle of a task through the `change` method.

Perform operations on the tasks final `product` through the operate method.

Nest tasks as deep as you'd like to perform a specific action and manipulate a data set throughout. 

### Implementation

<pre>
var task = new Task({
    name:"SequenceTask",
    concurrent:true,
    type:"sequence",
    tasks:[{
        name:"SimpleTask",
        task:function(){
            // perform functionality
        },
        change:function(state,error){
            if(state == "progress"){
                // handle progress
            }else if(state == "complete"){
               // handle completion
            } else if (state == "error"){
                // handle error
            }
        },
        operate:function(operator){
            // operate on product
        }
    }],
    change:function(state,error){
        if(state == "progress"){
            // handle progress
        }else if(state == "complete"){
            // handle completion
        } else if (state == "error"){
            // handle error
        }
    },
    operate:function(operator){
        // operate on product
    }
});

task.start();
</pre>

### Product Operations

Accessing and modifying the `product` produced by a task or task group is handled through the `operate` method available on each task.

The method takes a single JavaScript `Object` as an argument. It's then up to the developer to choose how to handle the passed data. If the operate method is not overridden, then the data passed will simply be applied to the product property on the object.

### Task Concurrency

The library provides a way for the tasks to be run [concurrently](http://en.m.wikipedia.org/wiki/Concurrent%20computing) via JavaScript [webworkers](http://www.html5rocks.com/en/tutorials/workers/basics/). Simply set the concurrent property to true, which is false by default, on the task object and the task and any sub tasks will be run on a parallel thread. If the browser does not currently support web works then the task group will run normally.

### Nesting

All tasks have the ability to have sub tasks nested within them, turning them into task groups. By default nested tasks run sequentially, unless otherwise specified. Currently the two types of task groups available are `sequence` and `parallel`. 

Sequential tasks run sub tasks one after another until all sub tasks complete. When all nested sub tasks are complete the `complete` state is passed to the task groups `change` method for handling.

Parallel tasks are task groups who's nested subtasks are executed side by side, executing whenever they can. Just like the sequential task group, when all sub tasks have completed the groups `change` method will be notified.

### Task Properties

* **name** - The name of the task, mainly used for logging and debugging.
* **concurrent** - Whether or not to take advantage of JavaScript web workers or not. If web workers are not available setting this property has no affect on the execution of the task.
* **type** - The type of task. sequence, parallel or simple. A task is simple by default and sequence by default if not set and subtasks are present.
* **tasks** - Array of subtasks to execute. Each task object within has the ability to have subtasks of its own.

### Task Methods

* **start** - Licks off the tasks functionality located within the task method.
* **complete** - call this method when the tasks functionality is complete.
* **operate** - Call this method once the action has been taken on the product.
* **fault** - Call this method when a tasks functionality fails. It takes a single argument of an 'Error' object.
* **task** - Function who's contents are the operational logic of the task itself.
* **change** - State based functionality that gets run when the tasks state changes.
