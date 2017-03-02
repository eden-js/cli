/**
 * Created by Alex.Taylor on 26/02/2016.
 */

// use strict
'use strict';

// require dependencies
const i18n   = require ('i18n');
const daemon = require ('daemon');

// require local dependencies
const config = require ('app/config');

/**
 * build example dameon class
 *
 * @compute
 * @express
 */
class locale extends daemon {
  /**
   * construct example daemon class
   */
  constructor () {
    // run super eden
    super ();

    // configure i18n
    i18n.configure (config.i18n);

    // bind private methods
    this._compile    = this._compile.bind (this);
    this._middleware = this._middleware.bind (this);

    // add app hook
    this.eden.post ('eden.app',     this._middleware);
    this.eden.post ('view.compile', this._compile);
  }

  /**
   * on view compile
   *
   * @param {Object} data
   *
   * @private
   */
  _compile (data) {
    // load all i18n strings
    let page = data.page;

    // check i18n
    if (!data.render.i18n) data.render.i18n = {};

    // load matches
    let translations = page.match (/\[i18n\|(.*?)\]/g);

    // check translations
    if (!translations) return;

    // loop translations
    for (var i = 0; i < translations.length; i++) {
      // load translation type
      let type = translations[i].replace ('[i18n|', '').replace (']', '');

      // load translation
      if (!data.render.i18n[type]) data.render.i18n[type] = i18n.__ (type);

      // replace in page
      page = page.replace ('[i18n|' + type + ']', data.render.i18n[type]);
    }

    // set page
    data.page = page;
  }

  /**
   * locale middleware
   *
   * @param {Express} app
   *
   * @private
   */
  _middleware (app) {
    // init i18n
    app.use (i18n.init);
  }
}

/**
 * export locale daemon class
 *
 * @type {locale}
 */
exports = module.exports = locale;
