
// require dependencies
const gulp       = require ('gulp');
const glob       = require ('glob-all');
const buffer     = require ('vinyl-buffer');
const source     = require ('vinyl-source-stream');
const uglify     = require ('gulp-uglify');
const babelify   = require ('babelify');
const sourcemaps = require ('gulp-sourcemaps');
const browserify = require ('browserify');

/**
 * build serviceworker task class
 *
 * @task serviceworker
 */
class serviceworkerTask {
  /**
   * construct serviceworker task class
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
    // create javascript array
    let entries = glob.sync (files);

    // browserfiy javascript
    return browserify ({
      entries : entries,
      paths   : [
        './',
        './app/bundles',
        './lib/bundles',
        './node_modules'
      ]
    })
      .transform (babelify)
      .bundle ()
      .pipe (source ('sw.min.js'))
      .pipe (buffer ())
      .pipe (sourcemaps.init ({
        'loadMaps' : true
      }))
      .pipe (uglify ({
        'compress' : true
      }))
      .pipe (sourcemaps.write ('./www/public/js'))
      .pipe (gulp.dest ('./www/public/js'));
  }

  /**
   * watch task
   *
   * @return {Array}
   */
  watch () {
    // return files
    return [
      'public/js/serviceworker.js'
    ];
  }
}

/**
 * export serviceworker task
 *
 * @type {serviceworkerTask}
 */
exports = module.exports = serviceworkerTask;
