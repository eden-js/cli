// Require dependencies
const glob = require('glob');
const path = require('path');

/**
 * Create Models Task class
 *
 * @task models
 */
class ModelsTask {

  /**
   * Construct Models Task class
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
    // Return promise
    return new Promise((resolve) => {
      // Grab model files
      let Models = [];

      for (let i = 0; i < files.length; i++) {
        Models = Models.concat(glob.sync(files[i]));
      }

      // Loop models
      const models = {};

      for (let key in Models) {
        models[path.basename(Models[key]).split('.')[0].toLowerCase()] = path.relative(global.appRoot, Models[key]);
      }

      // Write models cache file
      this._runner.write('models', models);

      // Restart server
      this._runner.restart();

      // Resolve
      resolve(true);
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
      'models/**/*.js'
    ];
  }

}

/**
 * Export Models Task class
 *
 * @type {ModelsTask}
 */
exports = module.exports = ModelsTask;
