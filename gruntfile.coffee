module.exports = (grunt) ->
  grunt.initConfig
    jshint:
      all:
        src: [
          'index.js'
          'lib/**/*.js'
          'bin/sharejs-cleaner'
          'config-examples/*.js'
          'test/**/*.js'
        ]
      options:
        jshintrc: '.jshintrc'

    mochacov:
      options:
        files: [
          'test/setup.js'
          'test/**/*.spec.js'
        ]
        ui: 'bdd'
        colors: true
      unit:
        options:
          reporter: 'spec'
      coverage:
        options:
          reporter: 'mocha-term-cov-reporter'
          coverage: true
      file:
        options:
          reporter: 'html-cov'
          coverage: true
          output: 'coverage.html'
    watch:
      all:
        files: ['lib/**/*.js', 'bin/*', 'test/**/*.*']
        tasks: ['test', 'coverage', 'notify:test']
    notify:
      test:
        options:
          message: 'Test run successfull'

  # Load Tasks
  grunt.loadNpmTasks 'grunt-contrib-jshint'
  grunt.loadNpmTasks 'grunt-simple-mocha'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-notify'
  grunt.loadNpmTasks 'grunt-mocha-cov'

  grunt.registerTask 'test', ['mochacov:unit']
  grunt.registerTask 'coverage', ['mochacov:file']

  # Register default task
  grunt.registerTask 'default', ['jshint', 'test']
