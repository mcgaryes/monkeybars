
$(function(){
	

	var task = TaskLibrary.Task.extend({
		name:"MyTask",
		performTask:function() {
			this.complete();
		}
	});

	//task.start();
	
});














/*

// FROM: JS The Definative Guide

function defineClass(data) {
    // Extract the fields we'll use from the argument object.
    // Set up default values.
    var classname = data.name;
    var superclass = data.extend || Object;
    var constructor = data.construct || function( ) {};
    var methods = data.methods || {};
    var statics = data.statics || {};
    var borrows;
    var provides;

    // Borrows may be a single constructor or an array of them.
    if (!data.borrows) borrows = [];
    else if (data.borrows instanceof Array) borrows = data.borrows;
    else borrows = [ data.borrows ];

    // Ditto for the provides property.
    if (!data.provides) provides = [];
    else if (data.provides instanceof Array) provides = data.provides;
    else provides = [ data.provides ];

    // Create the object that will become the prototype for our class.
    var proto = new superclass( );

    // Delete any noninherited properties of this new prototype object.
    for(var p in proto)
        if (proto.hasOwnProperty(p)) delete proto[p];

    // Borrow methods from "mixin" classes by copying to our prototype.
    for(var i = 0; i < borrows.length; i++) {
        var c = data.borrows[i];
        borrows[i] = c;
        // Copy method properties from prototype of c to our prototype
        for(var p in c.prototype) {
            if (typeof c.prototype[p] != "function") continue;
            proto[p] = c.prototype[p];
        }
    }
    // Copy instance methods to the prototype object
    // This may overwrite methods of the mixin classes
    for(var p in methods) proto[p] = methods[p];

    // Set up the reserved "constructor", "superclass", and "classname"
    // properties of the prototype.
    proto.constructor = constructor;
    proto.superclass = superclass;
    // classname is set only if a name was actually specified.
    if (classname) proto.classname = classname;

    // Verify that our prototype provides all of the methods it is supposed to.
    for(var i = 0; i < provides.length; i++) {  // for each class
        var c = provides[i];
        for(var p in c.prototype) {   // for each property
            if (typeof c.prototype[p] != "function") continue;  // methods only
            if (p == "constructor" || p == "superclass") continue;
            // Check that we have a method with the same name and that
            // it has the same number of declared arguments.  If so, move on
            if (p in proto &&
                typeof proto[p] == "function" &&
                proto[p].length == c.prototype[p].length) continue;
            // Otherwise, throw an exception
            throw new Error("Class " + classname + " does not provide method "+
                            c.classname + "." + p);
        }
    }

    // Associate the prototype object with the constructor function
    constructor.prototype = proto;

    // Copy static properties to the constructor
    for(var p in statics) constructor[p] = data.statics[p];

    // Finally, return the constructor function
    return constructor;
}
var Comparable = defineClass({
    name: "Comparable",
    methods: { compareTo: function(that) { throw "abstract"; } }
});
var comparable = new Comparable();
console.log(comparable);

*/





























