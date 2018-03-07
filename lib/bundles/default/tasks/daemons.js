
// require dependencies
const gulp    = require ('gulp');
const through = require ('through2');

// require local dependencies
const parser = require ('lib/utilities/parser');

/**
 * build daemons task class
 *
 * @task daemons
 */
class daemonsTask {
  /**
   * construct daemons task class
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
    let Daemons = {};

    // get all routes
    return gulp.src (files)
      .pipe (through.obj ((chunk, enc, cb) => {
        // run pipe chunk
        this._runner.merge (Daemons, parser.daemon (chunk));

        // run callback
        cb (null, chunk);
      }))
      .on ('end', () => {
        // write config file
        this._runner.write ('daemons', Daemons.daemons);

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
      'daemons/**/*.js'
    ];
  }
}

/**
 * export daemons task
 *
 * @type {daemonsTask}
 */
exports = module.exports = daemonsTask;
