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
        }
    });

    // load npm tasks
    grunt.loadNpmTasks('grunt-jasmine-task');

    // tasks
    grunt.registerTask('default', 'jasmine min');
    
};