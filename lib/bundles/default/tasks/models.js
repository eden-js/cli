
// require dependencies
const glob = require ('glob');

/**
 * build models task class
 *
 * @task models
 */
class modelsTask {
  /**
   * construct models task class
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
    // return promise
    return new Promise ((resolve) => {
      // grab model files
      let Models = [];
      for (var i = 0; i < files.length; i++) {
        Models = Models.concat (glob.sync (files[i]));
      }

      // loop models
      let models = {};
      for (var key in Models) {
        models[Models[key].split ('/')[(Models[key].split ('/').length - 1)].split ('.')[0].toLowerCase ()] = Models[key].replace ('./', '/').replace (global.appRoot, '');
      }

      // write models cache file
      this._runner.write ('models', models);

      // restart server
      this._runner.restart ();

      // resolve
      resolve (true);
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
      'models/**/*.js'
    ];
  }
}

/**
 * export models task
 *
 * @type {modelsTask}
 */
exports = module.exports = modelsTask;
