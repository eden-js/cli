// require dependencies
const fs         = require ('fs-extra');
const os         = require ('os');
const sass       = require ('gulp-sass');
const gulp       = require ('gulp');
const path       = require ('path');
const rename     = require ('gulp-rename');
const through    = require ('through2');
const sourcemaps = require ('gulp-sourcemaps');
const prefix     = require ('gulp-autoprefixer');

// require local dependencies
const config = require ('config');

/**
 * build javascript task class
 *
 * @task sass
 */
class sassTask {

  /**
   * construct javascript task class
   *
   * @param {loader} runner
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
  run () {
    // return new promise
    return new Promise ((resolve) => {
      // run tmp
      this._tmp ().then (() => {
        // run gulp task
        gulp.src (global.appRoot + '/app/cache/tmp.scss')
          .pipe (sourcemaps.init ())
          .pipe (sass ({
            'outputStyle' : 'compressed'
          }))
          .pipe (prefix ({
            'browsers' : [
              'last 2 versions'
            ]
          }))
          .pipe (rename ('app.min.css'))
          .pipe (sourcemaps.write ('./www/public/css'))
          .pipe (gulp.dest ('./www/public/css'))
          .on ('end', resolve)
          .on ('error', (err) => {
            // log error
            console.error (err);

            // resolve
            resolve ();
          });
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
    let all = '';

    // grab gulp source for sass
    // create local variables array for sass files
    let sassFiles = this._runner.files ('public/scss/variables.scss');

    // load sass
    let configSass = config.get ('sass');

    // loop config sass files
    if (configSass) {
      for (let i = 0; i < configSass.length; i++) {
        sassFiles.push (configSass[i]);
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

          // update type
          type = type[type.length - 1];

          // check type
          if (type === 'css') {
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
