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
   * @param {Loader} runner
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
      // Grab absolute files
      let absoluteFiles = [];

      // Loop files
      for (const file of files) {
        // Add globbed file to absolute files
        absoluteFiles = absoluteFiles.concat(glob.sync(file));
      }

      // Set locales and namespaces
      const locales     = [];
      const localeTypes = [];
      const namespaces  = [];

      // Loop absolute files
      for (const absoluteFile of absoluteFiles) {
        // Set locale
        let locale = path.basename(absoluteFile).replace('.json', '');

        // Set namespace
        let namespace = config.get('i18n.defaultNS') || 'default';

        // Check locale
        if (locale.split('.').length > 1) {
          // Update namespace
          namespace = locale.split('.')[0];

          // Update locale
          locale = locale.split('.')[1];
        }

        // Add to arrays
        if (!localeTypes.includes(locale)) localeTypes.push(locale);
        if (!namespaces.includes(namespace)) namespaces.push(namespace);

        // Ensure namespace exists
        if (!locales[namespace]) locales[namespace] = {};

        // Ensure locale exists
        if (!locales[namespace][locale]) locales[namespace][locale] = {};

        // Extend locale
        this.extend(locales[namespace][locale], require(absoluteFile));
      }

      // Set locale folder
      let frontend = path.join(global.appRoot, 'www', 'locales');

      // Remove cache
      if (fs.existsSync(frontend)) fs.removeSync(frontend);

      // Mkdir
      fs.ensureDirSync(frontend);

      // Create files
      for (let namespace in locales) {
        // Ensure namespace exists
        if (locales.hasOwnProperty(namespace)) {
          // Loop for namespaces
          for (let locale in locales[namespace]) {
            // Ensure locale exists
            if (locales[namespace].hasOwnProperty(locale)) {
              // Let path
              let filePath = path.join(frontend, namespace + '.' + locale + '.json');

              // Write sync
              fs.writeFileSync(filePath, JSON.stringify(locales[namespace][locale]), 'utf8');
            }
          }
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
