// Require dependencies
const gulp      = require('gulp');
const through   = require('through2');
const deepMerge = require('deepmerge');

// Require local dependencies
const parser = require('lib/utilities/parser');

/**
 * Create Controllers Task class
 *
 * @task controllers
 */
class ControllersTask {
  /**
   * Construct Controllers Task class
   *
   * @param {Loader} runner
   */
  constructor(runner) {
    // Set private variables
    this._runner = runner;

    // Bind public methods
    this.run = this.run.bind(this);
    this.watch = this.watch.bind(this);
  }

  /**
   * Run assets task
   *
   * @return {Promise}
   */
  run() {
    // Set config
    let config = {};

    // Get all routes
    return gulp.src(this._runner.files('controllers/**/*.js'))
      .pipe(through.obj((chunk, enc, cb) => {
        // Run pipe chunk
        config = deepMerge(config, parser.controller(chunk));

        // Run callback
        cb(null, chunk);
      }))
      .on('end', () => {
        // Loop types in config
        for (const type of Object.keys(config)) {
          // Write config file
          this._runner.write(type, config[type]);
        }

        // Restart server
        this._runner.restart();
      });
  }

  /**
   * Watch task
   *
   * @return {string[]}
   */
  watch() {
    // Return files
    return [
      'controllers/**/*.js',
      'helpers/**/*.js',
    ];
  }
}

/**
 * Export Controllers Task class
 *
 * @type {ControllersTask}
 */
module.exports = ControllersTask;
