"use strict";

var monkeyBarsName          =   "MonkeyBars";
var monkeyBarsVersion       =   "0.9.5";
var monkeyBarsDescription   =   "Task library that provides a simple structure for handling singular, sequential and parallel units of code.";
var monkeyBarsRepository    =   "https://github.com/mcgaryes/monkeybars/";
var monkeyBarsBanner        =   "/*!\n* MonkeyBars v" + monkeyBarsVersion + "\n* " + monkeyBarsDescription + " \n* " + monkeyBarsRepository + "\n*/";

// object will be used to create the package.json file for npm manager
var monkeyBarsPackageJsonTemplate = {
    "name": monkeyBarsName.toLowerCase(),
    "version": monkeyBarsVersion,
    "description": monkeyBarsDescription,
    "keywords": ["task", "sequence", "parallel", "asynchronous", "async", "util"],
    "homepage": monkeyBarsRepository,
    "bugs": {
        "url": monkeyBarsRepository + "issues"
    },
    "main": monkeyBarsName.toLowerCase() + ".js",
    "repository": {
        "type": "git",
        "url": monkeyBarsRepository
    },
    "licenses": [{
        "type": "MIT",
        "url": monkeyBarsRepository + "master/LICENSE"
    }]
};

// grunt config
module.exports = function(grunt) {

    // config
    grunt.initConfig({
        lint: {
            files: ['grunt.js','../monkeybars.js']
        },
        meta: {
            banner: monkeyBarsBanner
        },
        jasmine: {
            all: {
                src: ['../tests/index.html'],
                errorReporting: true
            }
        },
        min: {
            dist: {
                src: ['<banner>', '../monkeybars.js'],
                dest: '../monkeybars.min.js'
            }
        },
        copy: {
            examples: {
                files: {
                    "../www/monkeybars.min.js": "../monkeybars.min.js",
                    "../www/": "../examples/**"
                }
            },
            package: {
                options: {
                    processContent: function() {
                        return JSON.stringify(monkeyBarsPackageJsonTemplate);
                    }
                },
                files: {
                    "../package.json": "../package.json"
                }
            }
        },
        yuidoc: {
            compile: {
                "name": monkeyBarsName,
                "description": monkeyBarsDescription,
                "version": monkeyBarsVersion,
                "url": monkeyBarsRepository,
                "logo":"../artwork/monkeybars.png",
                options: {
                    paths: "../",
                    outdir: "../docs/"
                }
            }
        },
        jshint: {
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                boss: true,
                eqnull: true,
                node: true,
                es5: true,
                smarttabs:false,
                strict:true
            },
            globals: {
                yui:true,
                worker:true
            }
        }
    });

    // load npm tasks
    grunt.loadNpmTasks('grunt-jasmine-task');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-yuidoc');

    // tasks
    grunt.registerTask('default', 'lint jasmine min copy:examples copy:package yuidoc');
};