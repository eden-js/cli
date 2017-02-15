
// require dependencies
const gulp    = require ('gulp');
const through = require ('through2');

// require local dependencies
const parser = require ('lib/utilities/parser');

/**
 * build controllers task class
 *
 * @task controllers
 */
class controllersTask {
  /**
   * construct controllers task class
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
    // set variables
    let Config = {};

    // get all routes
    return gulp.src (files)
      .pipe (through.obj ((chunk, enc, cb) => {
        // run pipe chunk
        this._runner.merge (Config, parser.controller (chunk));

        // run callback
        cb (null, chunk);
      }))
      .on ('end', () => {
        // write types
        for (var type in Config) {
          // write config file
          this._runner.write (type, Config[type]);
        }

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
      'controllers/**/*.js'
    ];
  }
}

/**
 * export controllers task
 *
 * @type {controllersTask}
 */
exports = module.exports = controllersTask;
