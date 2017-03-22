
// require dependencies
const fs         = require ('fs-extra');
const gulp       = require ('gulp');
const riot       = require ('gulp-riot');
const path       = require ('path');
const concat     = require ('gulp-concat');
const header     = require ('gulp-header');
const rename     = require ('gulp-rename');
const sourcemaps = require ('gulp-sourcemaps');

// require local dependencies
const config = require ('config');

/**
 * build riot task class
 *
 * @task     riot
 * @after    javascript
 * @priority 1
 */
class riotTask {
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

    // bind private methods
    this._views = this._views.bind (this);
  }

  /**
   * run riot task
   *
   * @return {Promise}
   */
  run (files) {
    // create header
    let head    = '';
    let include = config.get ('view.include') || {};

    // loop include
    for (var key in include) {
      head += 'const ' + key + ' = require ("' + include[key] + '");';
    }

    // return promise
    return new Promise ((resolve, reject) => {
      // await views
      this._views (files).then (() => {
        // return promise
        gulp.src ([
          global.appRoot + '/app/cache/views/**/*.js',
          global.appRoot + '/app/cache/views/**/*.tag'
        ])
          .pipe (sourcemaps.init ())
          .pipe (riot ({
            'compact'    : true,
            'whitespace' : false
          }))
          .pipe (concat ('tags.js'))
          .pipe (header ('const riot = require ("riot"); const riotcontrol = require ("riotcontrol");'))
          .pipe (gulp.dest (global.appRoot + '/app/cache'))
          .pipe (header (head))
          .pipe (rename ('tags.min.js'))
          .pipe (sourcemaps.write ('./'))
          .pipe (gulp.dest (global.appRoot + '/app/cache'))
          .on ('end', resolve)
          .on ('error', reject);
      });
    });
  }

  /**
   * watch task
   *
   * @return {Array}
   */
  watch () {
    // return files
    return 'views/**/*';
  }

  /**
   * run riot views
   *
   * @return {Promise}
   * @private
   */
  _views (files) {
    // remove views cache directory
    fs.removeSync (global.appRoot + 'app/cache/views');

    // return promise
    return new Promise ((resolve, reject) => {
      // run gulp
      gulp.src (files)
        .pipe (rename ((filePath) => {
          var amended = filePath.dirname.split (path.sep);
          amended.shift ();
          amended.shift ();
          filePath.dirname = amended.join (path.sep);
        }))
        .pipe (gulp.dest (global.appRoot + '/app/cache/views'))
        .on ('end', resolve)
        .on ('error', reject);
    });
  }
}

/**
 * export riot task
 *
 * @type {riotTask}
 */
exports = module.exports = riotTask;
