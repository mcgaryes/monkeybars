module.exports = function(grunt) {
    
	// config
    grunt.initConfig({
        version: '0.9.1',
        meta: {
            banner: "/*!\n" + 
                    "*\n" + 
                    "* MonkeyBars v<%= version %>\n" + 
                    "* \n" + 
                    "* Task library that provides a simple structure for handling singular, sequential \n" +
                    "* and parallel units of code. \n" + 
                    "*\n" + 
                    "* https://github.com/mcgaryes/monkeybars\n" + 
                    "*\n" + 
                    "*/"
        },
    	jasmine: {
            all: {
                src: ['../tests/index.html'],
                errorReporting: true
            }
        },
        min: {
            dist: {
                src: ['<banner>','../source/monkeybars.js'],
                dest: '../source/monkeybars.min.js'
            }
        },
        copy: {
            default:{
                files: {
                    // individual
                    "../www/monkeybars.min.js": "../source/monkeybars.min.js",
                    // directory
                    "../www/": "../examples/**"
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
                    paths: "../source/",
                    outdir: "../docs/"
                }
            }
        }
    });

    // load npm tasks
    grunt.loadNpmTasks('grunt-jasmine-task');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-yuidoc');

    // tasks
    grunt.registerTask('default', 'jasmine min copy yuidoc');
    
};