# MonkeyBars

A task based library that provides a simple structure for handling singular, sequential and parallel units of code. 

The overall architecture is based off of the [composite](http://en.m.wikipedia.org/wiki/Composite%20pattern) and [decorator](http://en.wikipedia.org/wiki/Decorator_pattern) patterns. These patterns lend themselves very well to a task based library, where tasks can contain other tasks all contributing to the overall flow of an operation.

This library also makes it possible to run tasks [concurrrently](http://en.wikipedia.org/wiki/Concurrent_computing) with help of HTML5 [WebWorkers](https://developer.mozilla.org/en-US/docs/DOM/Using_web_workers) and [Blobs](https://developer.mozilla.org/en-US/docs/DOM/Blob).

### Installation

The library itself has no hard ties to the browser, and because of this it works both in client side & server side javascript projects. Include *monkeybars.min.js* for your client side projects or install using [npm](https://npmjs.org/package/monkeybars) by running the following command from within your project:

<pre>
$ npm install monkeybars [-g]
</pre>

### Examples

Examples for the library can be found in the [examples](https://github.com/mcgaryes/monkeybars/tree/master/examples) directory of this project.

### Documentation

There are detailed explanations for different aspects of the library available within the wiki pages.

* [Concurrency](https://github.com/mcgaryes/monkeybars/wiki/Concurrency)
* [Decorating Tasks](https://github.com/mcgaryes/monkeybars/wiki/Decorating-Tasks)
* [Dependency Mapping](https://github.com/mcgaryes/monkeybars/wiki/Dependency-Mapping)
* [Extending Tasks](https://github.com/mcgaryes/monkeybars/wiki/Extending-Tasks)
* [Nesting](https://github.com/mcgaryes/monkeybars/wiki/Nesting)
* [Product-Manipulation](https://github.com/mcgaryes/monkeybars/wiki/Product-Manipulation)
* [Runtime Insertion](https://github.com/mcgaryes/monkeybars/wiki/Runtime-Insertion)
* [Task Implementation](https://github.com/mcgaryes/monkeybars/wiki/Task-Implementation)
* [Task Options](https://github.com/mcgaryes/monkeybars/wiki/Task-Options)

API documentation, including methods and properties available to task types, can be seen [here](http://mcgaryes.github.com/monkeybars/docs/).
