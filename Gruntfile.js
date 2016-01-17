module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    eslint: {
      target: ['src/**/*.js']
    },

    babel: {
      options: {
        presets: ['es2015'],
      },
      dist: {
        files: [{
          expand: true,
          flatten: false,
          cwd: 'src/',
          src: ['**/*.js'],
          dest: 'dist/',
          ext: '.js'
        }]
      }
    },

    watch: {
      babel: {
        files: [
          'src/app.js', 
          'src/routes/**/*.js',  
          'src/bin/**/*.js',
          'src/latex/**/*.js'
        ],
        tasks: ['babel'],
        options: {
          spawn: false
        },
      }
    },

  });

  require('load-grunt-tasks')(grunt);

  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task(s).
  grunt.registerTask('default', ['babel']);
  grunt.registerTask('dev', ['eslint', 'babel', 'watch']);
};