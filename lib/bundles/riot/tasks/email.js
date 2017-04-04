
// require dependencies
const gulp       = require ('gulp');
const riot       = require ('gulp-riot');
const concat     = require ('gulp-concat');
const header     = require ('gulp-header');
const rename     = require ('gulp-rename');
const sourcemaps = require ('gulp-sourcemaps');

// require local dependencies
const config = require ('config');

/**
 * build riot task class
 *
 * @task     email
 * @after    riot
 * @priority 1
 */
class emailTask {
  /**
   * construct riot task class
   *
   * @param {gulp} gulp
   */
  constructor (runner) {
    // set private variables
    this._runner = runner;

    // bind methods
    this.run   = this.run.bind (this);
    this.watch = this.watch.bind (this);
  }

  /**
   * run riot task
   *
   * @return {Promise}
   */
  run () {
    // create header
    let head    = '';
    let include = config.get ('view.include') || {};

    // loop include
    for (var key in include) {
      head += 'const ' + key + ' = require ("' + include[key] + '");';
    }

    // return promise
    return gulp.src ([
      global.appRoot + '/app/cache/views/email/**/*.tag'
    ])
      .pipe (sourcemaps.init ())
      .pipe (riot ({
        'compact'    : true,
        'whitespace' : false
      }))
      .pipe (concat ('emails.js'))
      .pipe (header ('const riot = require ("riot"); const riotcontrol = require ("riotcontrol");'))
      .pipe (gulp.dest (global.appRoot + '/app/cache'))
      .pipe (header (head))
      .pipe (rename ('emails.min.js'))
      .pipe (sourcemaps.write ('./'))
      .pipe (gulp.dest (global.appRoot + '/app/cache'));
  }

  /**
   * watch task
   *
   * @return {Array}
   */
  watch () {
    // return files
    return 'views/email/**/*.tag';
  }
}

/**
 * export email task
 *
 * @type {emailTask}
 */
exports = module.exports = emailTask;
