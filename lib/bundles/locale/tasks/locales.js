
// Require dependencies
const fs     = require('fs-extra');
const glob   = require('glob');
const path   = require('path');
const extend = require('extendify');

// Require local dependencies
const config = require('config');

/**
 * Build locale task class
 *
 * @task locales
 */
class localesTask {

  /**
   * Construct locale task class
   *
   * @param {edenGulp} runner
   */
  constructor (runner) {
    // Set private variables
    this._runner = runner;

    // Bind variables
    this.extend = extend();

    // Bind methods
    this.run   = this.run.bind(this);
    this.watch = this.watch.bind(this);
  }

  /**
   * Run assets task
   *
   * @param {Array} files
   *
   * @return {Promise}
   */
  run (files) {
    // Return promise
    return new Promise((resolve) => {
      // Grab locale files
      let Files = [];

      // Loop files
      for (let a = 0; a < files.length; a++) {
        Files = Files.concat(glob.sync(files[a]));
      }

      // Loop Locales
      let Locales    = {};
      let locales    = [];
      let namespaces = [];

      // Loop files
      for (let b = 0; b < Files.length; b++) {
        // Get locale
        let Locale = Files[b].split(path.sep);

        // Replace
        Locale = Locale[(Locale.length - 1)].replace('.json', '');

        // Set namespace
        let Namespace = config.get('i18n.defaultNS') || 'default';

        // Check Locale
        if (Locale.split('.').length > 1) {
          // Set Namespace
          Namespace = Locale.split('.')[0];

          // Set locale
          Locale = Locale.split('.')[1];
        }

        // Add to arrays
        if (!locales.includes(Locale)) locales.push(Locale);
        if (!namespaces.includes(Namespace)) namespaces.push(Namespace);

        // Check locale exists
        if (!Locales[Namespace]) Locales[Namespace] = {};

        // Check Namespace
        if (!Locales[Namespace][Locale]) Locales[Namespace][Locale] = {};

        // Extend
        this.extend(Locales[Namespace][Locale], require(Files[b]));
      }

      // Set locale folder
      let Frontend = global.appRoot + path.sep + 'www' + path.sep + 'locales';

      // Remove cache
      if (fs.existsSync(Frontend)) fs.removeSync(Frontend);

      // Mkdir
      fs.ensureDirSync(Frontend);

      // Create files
      for (let namespace in Locales) {
        // Loop for namespaces
        for (let locale in Locales[namespace]) {
          // Let path
          let filePath = path.sep + namespace + '.' + locale + '.json';

          // Write sync
          fs.writeFileSync(Frontend + filePath, JSON.stringify(Locales[namespace][locale]), 'utf8');
        }
      }

      // Get namespaces and Locales
      this._runner.write('locale', {
        'locales'    : locales,
        'namespaces' : namespaces
      });

      // Restart server
      this._runner.restart();

      // Resolve
      resolve(true);
    });
  }

  /**
   * Watch task
   *
   * @return {Array}
   */
  watch () {
    // Return files
    return [
      'locales/*'
    ];
  }
}

/**
 * Export locales task
 *
 * @type {localesTask}
 */
exports = module.exports = localesTask;
