* **2013.02.09** - *v0.9.15*
	* Rewriting of some of the Task prototype property descriptors

* **2013.02.07** - *v0.9.14*
	* Fixed an issue where unreferenced `tasks` attribute was not being instantiated for the `initialize` method with use of `addSubTask`
	* Fixed issue with tasks being processed in parallel task before the task had been started

* **2013.01.31** - *v0.9.13*
	* `onChange` is no longer a public method
	* Tasks now have events and can be referenced through `on`, `off`, `has` and `trigger` methods of the task
		* This was implemented to increase the shear number of tasks that can be run
		* Triggering state changes is not suggested
	* Performace tuning updates
		* "SequenceTasks" now are wrapped in a `setTimeout` to increase the number of tasks that can be run in sequence
		* Load tests are now part of the unit testing 
			* ParallelTask - 10000 simultaneous
			* SequenceTask - 2000 (takes longer because of the timeout)
	* `currentIndex` and `processedIndex` of group tasks are now private properties
	* 'state' is now only a getter
	* Removed `max` attribute until I can further gauge its usefulness

* **2013.01.11** - *v0.9.10*
	* Source development is now completed in the `source` directory in smaller more managable pieces
	* Updated build file to pull and combine files from `source` directory
	* Optimizations for file size

* **2013.01.11** - *v0.9.9*
	* Renamed while to doWhile
	* Updates to Unit Tests
	* Added `initialize` method to Task 
	* Added `options` property for attributes outside of whitelist
	* Task `product` was renamed to `data`
	* Rework of `data` manipulation
	* Replaced generic abstract examples with more concrete ones
