// Require dependencies
const glob = require('@edenjs/glob');
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
   * @param   {array} files
   */
  async run(files) {
    // Loop models
    const models = {};

    // loop models
    for (const model of await glob(files)) {
      // add to models
      models[path.basename(model).split('.')[0].toLowerCase()] = model;
    }

    // Write models cache file
    await this._runner.write('models', models);

    // Restart server
    this._runner.restart();
  }

  /**
   * Watch task
   *
   * @return {string[]}
   */
  watch() {
    // Return files
    return [
      'models/**/*.js',
    ];
  }
}

/**
 * Export Models Task class
 *
 * @type {ModelsTask}
 */
module.exports = ModelsTask;
