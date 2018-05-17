// Require dependencies
const gulp   = require('gulp');
const path   = require('path');
const rename = require('gulp-rename');

/**
 * Create Assets Task class
 *
 * @task assets
 */
class AssetsTask {

  /**
   * Construct Assets Task class
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
   * Run Assets Task
   *
   * @param  {array} files
   *
   * @return {Promise}
   */
  run (files) {
    // Move images into single folder
    return gulp.src(files)
      .pipe(rename((filePath) => {
        // Set amended
        const amended = filePath.dirname.split(path.sep);

        // Remove amended
        amended.shift();
        amended.shift();
        amended.shift();

        // Join amended
        filePath.dirname = amended.join(path.sep);
      }))
      .pipe(gulp.dest(global.appRoot + '/www/public/assets'));
  }

  /**
   * Watch task
   *
   * @return {string[]}
   */
  watch () {
    // Return files
    return [
      'public/assets/**/*'
    ];
  }

}

/**
 * Export Assets Task class
 *
 * @type {AssetsTask}
 */
exports = module.exports = AssetsTask;
