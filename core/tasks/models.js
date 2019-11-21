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
   * run in background
   *
   * @param {*} files 
   */
  async run(files) {
    // run models in background
    await this._runner.thread(this.thread, {
      files,

      appRoot : global.appRoot,
    });

    // Restart server
    this._runner.restart();
  }

  /**
   * Run assets task
   *
   * @param   {array} files
   */
  async thread(data) {
    // Require dependencies
    const fs   = require('fs-extra');
    const glob = require('@edenjs/glob');
    const path = require('path');

    // Loop models
    const models = {};

    // loop models
    for (const model of await glob(data.files)) {
      // add to models
      models[path.basename(model).split('.')[0].toLowerCase()] = model;
    }

    // Write models cache file
    await fs.writeJson(`${data.appRoot}/.edenjs/.cache/models.json`, models);
  }

  /**
   * Watch task
   *
   * @return {string[]}
   */
  watch() {
    // Return files
    return [
      'models/**/*.{js,jsx,ts,tsx}',
    ];
  }
}

/**
 * Export Models Task class
 *
 * @type {ModelsTask}
 */
module.exports = ModelsTask;
