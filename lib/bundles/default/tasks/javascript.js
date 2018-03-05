
// require dependencies
const fs         = require ('fs-extra');
const os         = require ('os');
const glob       = require ('glob-all');
const gulp       = require ('gulp');
const buffer     = require ('vinyl-buffer');
const source     = require ('vinyl-source-stream');
const header     = require ('gulp-header');
const uglify     = require ('gulp-uglify-es').default;
const babelify   = require ('babelify');
const sourcemaps = require ('gulp-sourcemaps');
const browserify = require ('browserify');

// require local dependencies
const config = require ('config');

/**
 * build javascript task class
 *
 * @task javascript
 */
class javascriptTask {
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
   * run javascript task
   *
   * @return {Promise}
   */
  run () {
    // create javascript array
    let entries = glob.sync ([
      global.appRoot + '/lib/bundles/*/public/js/bootstrap.js',
      global.appRoot + '/app/bundles/*/public/js/bootstrap.js'
    ]);

    // build vendor prepend
    let js   = config.get ('js');
    let head = '';

    // loop javascript
    (js || []).forEach ((file) => {
      head += fs.readFileSync (file, 'utf8') + os.EOL;
    });

    // browserfiy javascript
    return browserify ({
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
      .transform (babelify)
      .bundle ()
      .pipe (source ('app.min.js'))
      .pipe (buffer ())
      .pipe (sourcemaps.init ({
        'loadMaps' : true
      }))
      .pipe (header (head))
      .pipe (uglify ({
        'ie8'    : false,
        'mangle' : true,
        'output' : {
          'comments' : false
        },
        'compress' : true,
      }))
      .pipe (sourcemaps.write (global.appRoot + '/www/public/js'))
      .pipe (gulp.dest (global.appRoot + '/www/public/js'))
      .on ('end', () => {
        // restart server
        this._runner.restart ();
      });
  }

  /**
   * watch task
   *
   * @return {Array}
   */
  watch () {
    // return files
    return [
      'public/js/**/*.js'
    ];
  }
}

/**
 * export javascript task
 *
 * @type {javascriptTask}
 */
exports = module.exports = javascriptTask;
