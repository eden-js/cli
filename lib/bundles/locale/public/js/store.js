
// require dependencies
const riot     = require ('riot');
const i18n     = require ('i18next');
const cache    = require ('i18next-localstorage-cache');
const backend  = require ('i18next-xhr-backend');
const sprintf  = require ('i18next-sprintf-postprocessor');
const detector = require ('i18next-browser-languagedetector');

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

    // bind i18n methods
    this.t = this.i18n.t.bind (this.i18n);

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

    // set defaults
    this.defaults = load.defaults || {};

    // use functions
    this.i18n
      .use (detector)
      .use (cache)
      .use (backend)
      .use (sprintf);

    // init
    this.i18n.init (load);

    // on load
    this.i18n.on ('loaded', () => {
      // set loaded
      this.loaded = true;

      // trigger update
      this.trigger ('update');
    });

    // on initialized
    this.i18n.on ('initialized', () => {
      // set initialized
      this.initialized = true;

      // trigger update
      this.trigger ('update');
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
    // check language
    if (!lang) {
      // load language
      if (!this.i18n.language) return false;

      // load only one
      if (this.i18n.language.indexOf (' ') > -1) {
        return this.i18n.language.split (' ')[this.i18n.language.split (' ').length - 1];
      }

      // return language
      return this.i18n.language;
    }

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
