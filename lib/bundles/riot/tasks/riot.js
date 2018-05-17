
// Require dependencies
const fs         = require('fs-extra');
const gulp       = require('gulp');
const riot       = require('gulp-riot');
const path       = require('path');
const concat     = require('gulp-concat');
const header     = require('gulp-header');
const rename     = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');

// Require local dependencies
const config = require('config');

/**
 * Build riot task class
 *
 * @task     riot
 * @after    javascript
 * @priority 1
 */
class riotTask {

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

    // Bind private methods
    this._views = this._views.bind(this);
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
          global.appRoot + '/app/cache/views/**/*.js',
          global.appRoot + '/app/cache/views/**/*.tag',
          '!' + global.appRoot + '/app/cache/views/email/**/*.tag'
        ])
          .pipe(sourcemaps.init())
          .pipe(riot({
            'compact'    : true,
            'whitespace' : false
          }))
          .pipe(concat('tags.js'))
          .pipe(header('const riot = require ("riot");'))
          .pipe(gulp.dest(global.appRoot + '/app/cache'))
          .pipe(header(head))
          .pipe(rename('tags.min.js'))
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
    return 'views/**/*';
  }

  /**
   * Run riot views
   *
   * @return {Promise}
   * @private
   */
  _views (files) {
    // Remove views cache directory
    fs.removeSync(global.appRoot + 'app/cache/views');

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
        .pipe(gulp.dest(global.appRoot + '/app/cache/views'))
        .on('end', resolve)
        .on('error', reject);
    });
  }
}

/**
 * Export riot task
 *
 * @type {riotTask}
 */
exports = module.exports = riotTask;
