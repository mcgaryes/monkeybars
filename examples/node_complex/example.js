"use strict";

// libs
var MonkeyBars = require("../../monkeybars");
var One = require("./one").One;
var Two = require("./two").Two;
var Five = require("./five").Five;
var Six = require("./six").Six;

// create the queue
var sequence = new MonkeyBars.SequenceTask({
	name:"Sequence",
	logLevel:MonkeyBars.LogLevels.Verbose,
	tasks:[ new One(), new Two(), new Five(), new Six() ]
});

sequence.start();