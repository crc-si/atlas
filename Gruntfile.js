// vim: tabstop:2,shiftwidth:2

module.exports = function(grunt) {
  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  //require('time-grunt')(grunt); // Not installed

  grunt.loadNpmTasks('grunt-shell');

  pkg: grunt.file.readJSON('package.json');

  // Define the configuration for all the tasks.
  grunt.initConfig({
    // What?
    yeoman: {
      app: require('./bower.json').appPath || 'app',
      dist: 'dist'
    },

    shell: {
      installBowerDep: {
        options: {
          stdout: true
        },
        command: ['echo "----- Installing bower dependencies -----"',
                  'bower install',
                  'echo "----- Installing bower dependencies -----"']
            .join('&&')
      },
    },

    copy: {
     bowerDep: {
       files: [
         {src: './lib/Requirejs/require.js', dest: './lib/require.js'},
         {src: './lib/Openlayers/index.js', dest: './lib/open-layers.js'}
       ]
     }
    },

    jsdoc : {
      dist : {
        src: ['src/**/*.js'],
        options: {
          configure: './jsdoc.conf.json'
        }
      }
    }
  });

  grunt.registerTask('buildDep', ['shell:installBowerDep', 'copy:bowerDep']);
  grunt.registerTask('docs', ['jsdoc']);
};