/**
 * @method operate
 * @param {Object} data
 * @param {String} type
 * @param {Task} task
 */
var operate = function(data, type, task) {
	if(data !== undefined) {
		if(type === OPERATION_TYPE_APPEND) {
			append(data,task);
		} else if(type === OPERATION_TYPE_OVERWRITE) {
			overwrite(data,task);
		} else if(type === OPERATION_TYPE_REPLACE) {
			replace(data,task);
		} else {
			replace(data,task);
		}
	}
};

/**
 * @method replace
 * @param {Object} data
 */
var replace = function(data,task) {
	if(task.group) {
		task.group.data = data;
	} else {
		this.data = data;
	}
};

/**
 * @method overwrite
 * @param {Object} data
 */
var overwrite = function(data,task) {
	throw "Not yet implemented";
};

/**
 * @method append
 * @param {Object} data
 */
var append = function(data,task) {
	throw "Not yet implemented";
};

var findNextClosestDataReference = function(task){

	// return the task if there is no group
	if(task.group === undefined) {
		return task;
	}

	// recurse until we find a group that has data assosiated with it
	if(task.group.data === undefined){
		return findNextClosestDataReference(task.group);
	} 
	
	// return the task group
	return task.group;
}