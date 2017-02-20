
// require dependencies
const fs         = require ('fs-extra');
const os         = require ('os');
const sass       = require ('gulp-sass');
const gulp       = require ('gulp');
const path       = require ('path');
const rename     = require ('gulp-rename');
const through    = require ('through2');
const sourcemaps = require ('gulp-sourcemaps');

// require local dependencies
const config = require ('app/config');

/**
 * build javascript task class
 *
 * @task sass
 */
class sassTask {
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

    // bind private methods
    this._tmp = this._tmp.bind (this);
  }

  /**
   * run sass task
   *
   * @return {Promise}
   */
  run (files) {
    // return new promise
    return new Promise ((resolve, reject) => {
      // run tmp
      this._tmp ().then (() => {
        // run gulp task
        gulp.src (global.appRoot + '/app/cache/tmp.scss')
          .pipe (sourcemaps.init ())
          .pipe (sass ({
              outputStyle : 'compressed'
          }))
          .pipe (rename ('app.min.css'))
          .pipe (sourcemaps.write ('./www/public/css'))
          .pipe (gulp.dest ('./www/public/css'))
          .on ('end', resolve)
          .on ('error', reject);
      });
    });
  }

  /**
   * builds temporary scss file
   *
   * @return {Promise}
   * @private
   */
  _tmp () {
    // set variables
    let all  = '';

    // grab gulp source for sass
    // create local variables array for sass files
    let sassFiles = this._runner.files ('public/scss/variables.scss');

    // loop config sass files
    if (config.sass && config.sass.length) {
      for (var i = 0; i < config.sass.length; i ++) {
        sassFiles.push (config.sass[i]);
      }
    }

    // push local bootstrap files
    sassFiles = sassFiles.concat (this._runner.files ('public/scss/bootstrap.scss'));

    // run gulp
    return new Promise ((resolve, reject) => {
      // run gulp on sass files
      gulp.src (sassFiles)
        .pipe (through.obj (function (chunk, enc, cb) {
          // run through callback
          let type = chunk.path.split ('.');
              type = type[type.length - 1];

          // check type
          if (type == 'css') {
            // prepend
            let prepend = fs.readFileSync (chunk.path, 'utf8');

            // push to this
            this.push ({
              'all' : prepend + os.EOL
            });
          } else {
            // push to this
            this.push ({
              'all' : '@import "../..' + chunk.path.replace (global.appRoot, '').replace (__dirname, '').split (path.sep).join ('/').split (path.delimiter).join ('/') + '";' + os.EOL
            });
          }

          // run callback
          cb (null, chunk);
        }))
        .on ('data', (data) => {
          if (data.all) {
            all += data.all;
          }
        })
        .on ('end', () => {
          // write temp sass file
          fs.writeFileSync (global.appRoot + '/app/cache/tmp.scss', all);

          // resolve
          resolve ();
        })
        .on ('error', reject);
    });
  }

  /**
   * watch task
   *
   * @return {Array}
   */
  watch () {
    // return files
    return 'public/scss/**/*.scss';
  }
}

/**
 * export sass task
 *
 * @type {sassTask}
 */
exports = module.exports = sassTask;
