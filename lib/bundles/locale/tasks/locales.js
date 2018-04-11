
// require dependencies
const fs     = require ('fs-extra');
const glob   = require ('glob');
const path   = require ('path');
const extend = require ('extendify');

// require local dependencies
const config = require ('config');

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

    // bind variables
    this.extend = extend ();

    // bind methods
    this.run   = this.run.bind (this);
    this.watch = this.watch.bind (this);
  }

  /**
   * run assets task
   *
   * @param {Array} files
   *
   * @return {Promise}
   */
  run (files) {
    // return promise
    return new Promise ((resolve) => {
      // grab locale files
      let Files = [];

      // loop files
      for (var a = 0; a < files.length; a++) {
        Files = Files.concat (glob.sync (files[a]));
      }

      // loop Locales
      let Locales    = {};
      let locales    = [];
      let namespaces = [];

      // loop files
      for (var b = 0; b < Files.length; b++) {
        // get locale
        let Locale = Files[b].split (path.sep);

        // replace
        Locale = Locale[(Locale.length - 1)].replace ('.json', '');

        // set namespace
        let Namespace = config.get ('i18n.defaultNS') || 'default';

        // check Locale
        if (Locale.split ('.').length > 1) {
          // set Namespace
          Namespace = Locale.split ('.')[0];

          // set locale
          Locale = Locale.split ('.')[1];
        }

        // add to arrays
        if (!locales.includes (Locale)) locales.push (Locale);
        if (!namespaces.includes (Namespace)) namespaces.push (Namespace);

        // check locale exists
        if (!Locales[Namespace]) Locales[Namespace] = {};

        // check Namespace
        if (!Locales[Namespace][Locale]) Locales[Namespace][Locale] = {};

        // extend
        this.extend (Locales[Namespace][Locale], require (Files[b]));
      }

      // set locale folder
      let Frontend = global.appRoot + path.sep + 'www' + path.sep + 'locales';

      // remove cache
      if (fs.existsSync (Frontend)) fs.removeSync (Frontend);

      // mkdir
      fs.mkdirSync (Frontend);

      // create files
      for (let namespace in Locales) {
        // loop for namespaces
        for (let locale in Locales[namespace]) {
          // let path
          let filePath = path.sep + namespace + '.' + locale + '.json';

          // write sync
          fs.writeFileSync (Frontend + filePath, JSON.stringify (Locales[namespace][locale]), 'utf8');
        }
      }

      // get namespaces and Locales
      this._runner.write ('locale', {
        'locales'    : locales,
        'namespaces' : namespaces
      });

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
