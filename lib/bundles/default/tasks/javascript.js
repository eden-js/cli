
// Require dependencies
const fs         = require('fs-extra');
const os         = require('os');
const glob       = require('glob-all');
const gulp       = require('gulp');
const buffer     = require('vinyl-buffer');
const source     = require('vinyl-source-stream');
const header     = require('gulp-header');
const uglify     = require('gulp-uglify-es').default;
const babelify   = require('babelify');
const sourcemaps = require('gulp-sourcemaps');
const browserify = require('browserify');

// Require local dependencies
const config = require('config');

/**
 * Create Javascript Task class
 *
 * @task javascript
 */
class JavascriptTask {

  /**
   * Construct Javascript Task class
   *
   * @param {Loader} runner
   */
  constructor (runner) {
    // Set private variables
    this._runner = runner;

    // Bind public methods
    this.run   = this.run.bind(this);
    this.watch = this.watch.bind(this);
  }

  /**
   * Run javascript task
   *
   * @return {Promise}
   */
  run () {
    // Create javascript array
    const entries = glob.sync([
      global.appRoot + '/lib/bundles/*/public/js/bootstrap.js',
      global.appRoot + '/app/bundles/*/public/js/bootstrap.js'
    ]);

    // Build vendor prepend
    let js   = config.get('js');
    let head = '';

    // Loop javascript
    (js || []).forEach((file) => {
      head += fs.readFileSync(file, 'utf8') + os.EOL;
    });

    // Browserify javascript
    let job = browserify({
      'paths' : [
        './',
        './app/bundles',
        './lib/bundles',
        './node_modules',
        './app/bundles/node_modules'
      ],
      'debug'         : true,
      'entries'       : entries,
      'ignoreGlobals' : true
    })
      .transform(babelify, {
        'presets' : [['@babel/preset-env', {
          'targets' : {
            'browsers' : ['> 1%', 'last 2 versions', 'not ie <= 8']
          },
          'useBuiltIns' : 'entry'
        }]],
        'plugins' : ['array-includes', '@babel/plugin-transform-classes', '@babel/plugin-transform-async-to-generator', ['@babel/transform-runtime', {
          'helpers'     : false,
          'polyfill'    : true,
          'moduleName'  : '@babel/runtime',
          'regenerator' : true
        }]]
      })
      .bundle()
      .pipe(source('app.min.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({
        'loadMaps' : true
      }))
      .pipe(header(head));

    // Only minify in live
    if (['live', 'production'].includes(config.get('environment'))) {
      job = job.pipe(uglify({
        'ie8'    : false,
        'mangle' : true,
        'output' : {
          'comments' : false
        },
        'compress' : true
      }));
    }

    // Pipe job
    job = job.pipe(sourcemaps.write(global.appRoot + '/www/public/js'))
      .pipe(gulp.dest(global.appRoot + '/www/public/js'))
      .on('end', () => {
        // Restart server
        this._runner.restart();
      });

    // Return job
    return job;
  }

  /**
   * Watch task
   *
   * @return {String[]}
   */
  watch () {
    // Return files
    return [
      'public/js/**/*.js'
    ];
  }

}

/**
 * Export Javascript Task class
 *
 * @type {JavascriptTask}
 */
exports = module.exports = JavascriptTask;
