module.exports = function(grunt) {

    "use strict";

    var monkeyBarsName = "MonkeyBars";
    var monkeyBarsVersion = "0.9.11";
    var monkeyBarsDescription = "Task library that provides a simple structure for handling singular, sequential and parallel units of code.";
    var monkeyBarsRepository = "https://github.com/mcgaryes/monkeybars/";
    var monkeyBarsHomePage = "http://mcgaryes.github.com/monkeybars/";
    var monkeyBarsBanner = "/*!\n* MonkeyBars v" + monkeyBarsVersion + "\n* " + monkeyBarsDescription + " \n* " + monkeyBarsHomePage + "\n*/";

    // object will be used to create the package.json file for npm manager
    var monkeyBarsPackageJsonTemplate = {
        "name": monkeyBarsName.toLowerCase(),
        "version": monkeyBarsVersion,
        "description": monkeyBarsDescription,
        "keywords": ["task", "sequence", "parallel", "asynchronous", "async", "util"],
        "homepage": monkeyBarsHomePage,
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

    // config
    grunt.initConfig({
        lint: {
            files: ['grunt.js', '../monkeybars.js']
        },
        meta: {
            banner: monkeyBarsBanner
        },
        jasmine: {
            all: {
                src: ['../tests/index-dist.html'],
                errorReporting: true
            }
        },
        min: {
            dist: {
                src: ['<banner>', '../monkeybars.js'],
                dest: '../monkeybars.min.js'
            }
        },
        combine: {
            source: {
                input: "../source/core.js",
                output: "../monkeybars.js",
                tokens: [{
                    token:"//%pre",
                    string:"/*!\n * @module MonkeyBars\n * @main MonkeyBars\n*/\n\n(function() {"
                },{
                    token:"//%worker",
                    file:"../source/worker.js"
                },{
                    token:"//%simple",
                    file:"../source/simple.js"
                },{
                    token:"//%group",
                    file:"../source/group.js"
                },{
                    token:"//%parallel",
                    file:"../source/parallel.js"
                },{
                    token:"//%sequence",
                    file:"../source/sequence.js"
                },{
                    token:"//%decorators",
                    file:"../source/decorators.js"
                },{
                    token:"//%post",
                    string:"}).call(this);"
                }]
            }
        },
        copy: {
            package: {
                options: {
                    processContent: function() {
                        return JSON.stringify(monkeyBarsPackageJsonTemplate);
                    }
                },
                files: {
                    "../package.json": "../package.json"
                }
            },
            version: {
                options: {
                    processContent: function() {
                        return monkeyBarsVersion;
                    }
                },
                files: {
                    "../VERSION": "../VERSION"
                }
            }
        },
        yuidoc: {
            compile: {
                "name": monkeyBarsName,
                "description": monkeyBarsDescription,
                "version": monkeyBarsVersion,
                "url": monkeyBarsHomePage,
                options: {
                    paths: "../",
                    outdir: "../docs/"
                }
            }
        },
        jsbeautifier : {
          files : ["../monkeybars.js"],
          options : {
            "indent_size": 4
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
                smarttabs: false,
                strict: true
            },
            globals: {
                yui: true,
                Worker: false,
                Blob: false,
                postMessage: false
            }
        }
    });

    // load npm tasks
    grunt.loadNpmTasks('grunt-jasmine-task');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-yuidoc');
    grunt.loadNpmTasks('grunt-combine');
    grunt.loadNpmTasks('grunt-jsbeautifier');

    // tasks
    grunt.registerTask('default', 'combine:source lint min jasmine jsbeautifier copy:package copy:version yuidoc');

};
