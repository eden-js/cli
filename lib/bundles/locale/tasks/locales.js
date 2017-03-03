
// require dependencies
const fs     = require ('fs-extra');
const glob   = require ('glob');
const path   = require ('path');
const extend = require ('object-extend');

/**
 * build locale task class
 *
 * @task locales
 */
class localesTask {
  /**
   * construct locale task class
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
    return new Promise ((resolve, reject) => {
      // grab locale files
      let Files = [];
      for (var a = 0; a < files.length; a++) {
        Files = Files.concat (glob.sync (files[a]));
      }

      // loop Locales
      let Locales = {};

      // loop files
      for (var b = 0; b < Files.length; b++) {
        // get locale
        let Locale = Files[b].split (path.sep);
            Locale = Locale[(Locale.length - 1)].replace ('.json', '');

        // set namespace
        let Namespace = 'default';

        // check Locale
        if (Locale.split ('.').length > 1) {
          // set Namespace
          Namespace = Locale.split ('.')[0];

          // set locale
          Locale = Locale.split ('.')[1];
        }

        // check locale exists
        if (!Locales[Namespace]) Locales[Namespace] = {};

        // check Namespace
        if (!Locales[Namespace][Locale]) Locales[Namespace][Locale] = {};

        // extend
        extend (Locales[Namespace][Locale], require (Files[b]));
      }

      // set locale folder
      let Folder = global.appRoot + path.sep + 'app' + path.sep + 'cache' + path.sep + 'locales';

      // remove cache
      if (fs.existsSync (Folder)) fs.removeSync (Folder);

      // mkdir
      fs.mkdirSync (Folder);

      // create files
      for (let namespace in Locales) {
        // loop for namespaces
        for (let locale in Locales[namespace]) {
          // let path
          let filePath = Folder + path.sep + namespace + '.' + locale + '.json';

          // write sync
          fs.writeFileSync (filePath, JSON.stringify (Locales[namespace][locale]));
        }
      }

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
      'locales/*'
    ];
  }
}

/**
 * export locales task
 *
 * @type {localesTask}
 */
exports = module.exports = localesTask;
