"use strict";

var monkeyBarsVersion = "0.9.2";

// will be added to the minified version of the library
var monkeyBarsBanner = "/*!\n*\n* MonkeyBars v" + monkeyBarsVersion + "\n* \n* Task library that provides a simple structure for handling singular, sequential \n* and parallel units of code. \n*\n* https://github.com/mcgaryes/monkeybars\n*\n*/";

// object will be used to create the package.json file for npm manager
var monkeyBarsPackageJsonTemplate = {
    "name": "monkeybars",
    "version": monkeyBarsVersion,
    "description": "Task library that provides a simple structure for handling singular, sequential and parallel units of code.",
    "keywords": ["task", "sequence", "parallel", "asynchronous", "async", "util"],
    "homepage": "https://github.com/mcgaryes/monkeybars",
    "bugs": {
        "url": "https://github.com/mcgaryes/monkeybars/issues"
    },
    "main": "monkeybars.js",
    "repository": {
        "type": "git",
        "url": "https://github.com/mcgaryes/monkeybars/"
    },
    "licenses": [{
        "type": "MIT",
        "url": "https://raw.github.com/mcgaryes/monkeybars/master/LICENSE"
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
                "name": "MonkeyBars",
                "description": "Simple structure for handling singular, sequential and parallel units of code.",
                "version": "0.0.1",
                "url": "https://github.com/mcgaryes/monkeybars",
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
                smarttabs:false
            },
            globals: {
                yui:true
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