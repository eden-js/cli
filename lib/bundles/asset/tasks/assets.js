
// require dependencies
const gulp   = require ('gulp');
const path   = require ('path');
const rename = require ('gulp-rename');

/**
 * build javascript task class
 *
 * @task assets
 */
class assetsTask {
  /**
   * construct javascript task class
   *
   * @param {edenGulp} runner
   */
  constructor (runner) {
    // set private variables
    this._runner = runner;

    // bind methods
    this.run   = this.run.bind (this);
    this.watch = this.watch.bind (this);
  }

  /**
   * run assets task
   *
   * @return {Promise}
   */
  run (files) {
    // move images into single folder
    return gulp.src (files)
      .pipe (rename ((filePath) => {
        let amended = filePath.dirname.split (path.sep);
        amended.shift ();
        amended.shift ();
        amended.shift ();
        filePath.dirname = amended.join (path.sep);
      }))
      .pipe (gulp.dest (global.appRoot + '/www/public/assets'));
  }

  /**
   * watch task
   *
   * @return {Array}
   */
  watch () {
    // return files
    return [
      'public/assets/**/*'
    ];
  }
}

/**
 * export assets task
 *
 * @type {assetsTask}
 */
exports = module.exports = assetsTask;
