module.exports = function(grunt) {
    grunt.initConfig({
        min: {
            dist: {
                src: ['../source/task.js'],
                dest: '../source/task.min.js'
            }
        }
    });
    grunt.registerTask('default', 'min');
};