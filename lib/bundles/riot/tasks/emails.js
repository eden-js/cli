
// Require dependencies
const fs         = require('fs-extra');
const gulp       = require('gulp');
const path       = require('path');
const riot       = require('gulp-riot');
const concat     = require('gulp-concat');
const header     = require('gulp-header');
const rename     = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');

// Require local dependencies
const config = require('config');

/**
 * Build riot task class
 *
 * @task emails
 */
class emailTask {

  /**
   * Construct riot task class
   *
   * @param {gulp} gulp
   */
  constructor (runner) {
    // Set private variables
    this._runner = runner;

    // Bind methods
    this.run   = this.run.bind(this);
    this.watch = this.watch.bind(this);
  }

  /**
   * Run riot task
   *
   * @return {Promise}
   */
  run (files) {
    // Create header
    let head    = '';
    let include = config.get('view.include') || {};

    // Loop include
    for (let key in include) {
      head += 'const ' + key + ' = require ("' + include[key] + '");';
    }

    // Return promise
    return new Promise((resolve, reject) => {
      // Await views
      this._views(files).then(() => {
        // Return promise
        gulp.src([
          global.appRoot + '/app/cache/emails/**/*.tag'
        ])
          .pipe(sourcemaps.init())
          .pipe(riot({
            'compact'    : true,
            'whitespace' : false
          }))
          .pipe(concat('emails.js'))
          .pipe(header('const riot = require ("riot");'))
          .pipe(gulp.dest(global.appRoot + '/app/cache'))
          .pipe(header(head))
          .pipe(rename('emails.min.js'))
          .pipe(sourcemaps.write('./'))
          .pipe(gulp.dest(global.appRoot + '/app/cache'))
          .on('end', resolve)
          .on('error', reject);
      });
    });
  }

  /**
   * Watch task
   *
   * @return {Array}
   */
  watch () {
    // Return files
    return 'emails/**/*.tag';
  }

  /**
   * Run riot views
   *
   * @return {Promise}
   * @private
   */
  _views (files) {
    // Remove views cache directory
    fs.removeSync(global.appRoot + 'app/cache/emails');

    // Return promise
    return new Promise((resolve, reject) => {
      // Run gulp
      gulp.src(files)
        .pipe(rename((filePath) => {
          let amended = filePath.dirname.split(path.sep);

          amended.shift();
          amended.shift();
          filePath.dirname = amended.join(path.sep);
        }))
        .pipe(gulp.dest(global.appRoot + '/app/cache/emails'))
        .on('end', resolve)
        .on('error', reject);
    });
  }
}

/**
 * Export email task
 *
 * @type {emailTask}
 */
exports = module.exports = emailTask;
