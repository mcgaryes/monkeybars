"use strict";

var MonkeyBars = require("../../monkeybars");
var Three = require("./three").Three;
var Four = require("./four").Four;

exports.Two = MonkeyBars.ParallelTask.extend({
	name:"Two",
	tasks:[ new Three(), new Four() ]
});