// Karma configuration
// based on https://github.com/mgechev/angular2-seed

module.exports = function(config) {
  config.set({
    files: [
      'node_modules/zone.js/dist/zone.js',
      'node_modules/zone.js/dist/long-stack-trace-zone.js',
      'node_modules/zone.js/dist/jasmine-patch.js',
      'node_modules/es6-module-loader/dist/es6-module-loader.js',
      'node_modules/traceur/bin/traceur-runtime.js', // Required by PhantomJS2, otherwise it shouts ReferenceError: Can't find variable: require
      'node_modules/traceur/bin/traceur.js',
      'node_modules/systemjs/dist/system.src.js',
      'node_modules/reflect-metadata/Reflect.js',
      // beta.7 IE 11 polyfills from https://github.com/angular/angular/issues/7144
      'node_modules/angular2/es6/dev/src/testing/shims_for_IE.js',

      // Loaded through the System loader, in `test-main.js`.
      {pattern: 'node_modules/angular2/**/*.js', included: false},
      {pattern: 'node_modules/angular2-jwt/angular2-jwt.js', included: false}, // PhantomJS2 (and possibly others) might require it
      {pattern: 'node_modules/rxjs/**', included: false},
      {pattern: 'src/js/**/*.js', included: false},
      {pattern: 'node_modules/faye/browser/faye-browser.js', included: false},
      {pattern: 'node_modules/systemjs/dist/system-polyfills.js', included: false}, // PhantomJS2 (and possibly others) might require it

      //tests entry point
      'test-main.js',
    ],

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    // list of files to exclude
    exclude: [
      'node_modules/angular2/**/*spec.js'
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'src/js/**/!(*spec).js': ['coverage']
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['mocha', 'coverage'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome', 'PhantomJS'],

    customLaunchers: {
      Chrome_travis_ci: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },
    
    coverageReporter: {
      dir: 'coverage/',
      reporters: [
        { type: 'text-summary' },
        { type: 'json', subdir: '.', file: 'coverage-final.json' },
        { type: 'html' }
      ]
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })

  if (process.env.APPVEYOR) {
    config.browsers = ['IE']
    config.singleRun = true
    config.browserNoActivityTimeout = 90000 // Note: default value (10000) is not enough
  }

  if (process.env.TRAVIS || process.env.CIRCLECI) {
    config.browsers = ['Chrome_travis_ci']
    config.singleRun = true
  }
}
