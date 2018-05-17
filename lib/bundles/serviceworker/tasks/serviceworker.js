
// Require dependencies
const gulp       = require('gulp');
const glob       = require('glob-all');
const buffer     = require('vinyl-buffer');
const source     = require('vinyl-source-stream');
const uglify     = require('gulp-uglify-es').default;
const babelify   = require('babelify');
const sourcemaps = require('gulp-sourcemaps');
const browserify = require('browserify');

/**
 * Build serviceworker task class
 *
 * @task serviceworker
 */
class serviceworkerTask {

  /**
   * Construct serviceworker task class
   *
   * @param {edenGulp} runner
   */
  constructor (runner) {
    // Set private variables
    this._runner = runner;

    // Bind methods
    this.run   = this.run.bind(this);
    this.watch = this.watch.bind(this);
  }

  /**
   * Run assets task
   *
   * @param {Array} files
   *
   * @return {Promise}
   */
  run (files) {
    // Create javascript array
    let entries = glob.sync(files);

    // Browserfiy javascript
    return browserify({
      'entries' : entries,
      'paths'   : [
        './',
        './app/bundles',
        './lib/bundles',
        './node_modules'
      ]
    })
      .transform(babelify)
      .bundle()
      .pipe(source('sw.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({
        'loadMaps' : true
      }))
      .pipe(uglify({
        'compress' : true
      }))
      .pipe(sourcemaps.write('./www'))
      .pipe(gulp.dest('./www'));
  }

  /**
   * Watch task
   *
   * @return {Array}
   */
  watch () {
    // Return files
    return [
      'public/js/serviceworker.js'
    ];
  }
}

/**
 * Export serviceworker task
 *
 * @type {serviceworkerTask}
 */
exports = module.exports = serviceworkerTask;
