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
                src: ['../source/task.js'],
                dest: '../source/task.min.js'
            }
        }
    });

    // load npm tasks
    grunt.loadNpmTasks('grunt-jasmine-task');

    // tasks
    grunt.registerTask('default', 'jasmine min');
    
};