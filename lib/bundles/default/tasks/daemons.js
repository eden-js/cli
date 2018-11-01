// Require dependencies
const gulp    = require('gulp');
const through = require('through2');

// Require local dependencies
const parser = require('lib/utilities/parser');

/**
 * Create Daemons Task class
 *
 * @task daemons
 */
class DaemonsTask {

  /**
   * Construct Daemons Task class
   *
   * @param {Loader} runner
   */
  constructor (runner) {
    // Set private variables
    this._runner = runner;

    // Bind public methods
    this.run   = this.run.bind(this);
    this.watch = this.watch.bind(this);
  }

  /**
   * Run assets task
   *
   * @param   {array} files
   *
   * @returns {Promise}
   */
  run (files) {
    // Set variables
    const roots = [];
    const daemons = {};

    // Get all routes
    return gulp.src(files)
      .pipe(through.obj((chunk, enc, cb) => {
        // Run pipe chunk
        this._runner.merge(daemons, parser.daemon(chunk));

        // Get roots
        let bundles = chunk.path.replace(/\\/g, '/').split('/bundles');

        // Pop
        bundles.pop();
        bundles = bundles.join('/bundles');

        // Check roots includes
        if (!roots.includes(bundles)) {
          // Push to roots
          roots.push(bundles + '/bundles');
        }

        // Run callback
        cb(null, chunk);
      }))
      .on('end', () => {
        // Write config file
        this._runner.write('daemons', daemons.daemons);
        this._runner.write('daemons.roots', roots);

        // Restart server
        this._runner.restart();
      });
  }

  /**
   * Watch task
   *
   * @return {string[]}
   */
  watch () {
    // Return files
    return [
      'daemons/**/*.js'
    ];
  }

}

/**
 * Export Daemons Task class
 *
 * @type {DaemonsTask}
 */
exports = module.exports = DaemonsTask;
