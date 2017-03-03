
// require dependencies
const riot    = require ('riot');
const i18n    = require ('i18next');
const cache   = require ('i18next-localstorage-cache');
const backend = require ('i18next-xhr-backend');
const sprintf = require ('i18next-sprintf-postprocessor');

// load riot store
const riotStore = require ('riot/public/js/store');

/**
 * create locale store
 */
class localeStore {
  /**
   * construct riot store
   */
  constructor () {
    // set observable
    riot.observable (this);

    // set i18n
    this.i18n = i18n;

    // bind methods
    this.lang  = this.lang.bind (this);
    this.build = this.build.bind (this);

    // build store
    this.build ();
  }

  /**
   * build locale store
   */
  build () {
    // load i18n
    let load = riotStore.get ('i18n');

    // use functions
    this.i18n
      .use (cache)
      .use (backend)
      .use (sprintf);

    // init
    this.i18n.init (load, () => {
      // trigger update
      this.trigger ('upate');
    });

    // set translate function
    this.t = this.i18n.t.bind (this.i18n);
  }

  /**
   * sets language
   *
   * @param {String} lang
   */
  lang (lang) {
    // change language
    this.i18n.changeLanguage (lang, () => {
      // trigger update
      this.trigger ('update');
    });
  }
}

/**
 * export built locale store
 *
 * @type {localeStore}
 */
exports = module.exports = new localeStore ();
