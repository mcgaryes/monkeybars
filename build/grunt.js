module.exports = function(grunt) {
    
	// config
    grunt.initConfig({

    	jasmine: {
            all: {
                src: ['../tests/index.html'],
                errorReporting: true
            }
        },

        min: {
            dist: {
                src: ['../source/monkeybars.js'],
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

    });

    // load npm tasks
    grunt.loadNpmTasks('grunt-jasmine-task');
    grunt.loadNpmTasks('grunt-contrib-copy');

    // tasks
    grunt.registerTask('default', 'jasmine min copy');
    
};