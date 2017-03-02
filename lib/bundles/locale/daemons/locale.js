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
    this._create = this._create.bind (this);
    this._remove = this._remove.bind (this);

    // run this
    this.eden.pre  ('view.render', this._create);
    this.eden.post ('view.render', this._remove);

    // use middleware
    if (this.eden.express) this.eden.router.use (i18n.init);
  }

  /**
   * create helper functions
   *
   * @param {Object} obj
   */
  _create (obj) {
    // let render
    let req    = obj.req;
    let render = obj.render;

    // set i18n variables
    if (!render.i18n) render.i18n = {
      'locale'           : req.getLocale (),
      [req.getLocale ()] : {}
    };

    // set helpers
    if (!render.helpers) render.helpers = {};

    // set helper
    render.helpers.i18n = (str) => {
      // set i18n
      if (!render.i18n[req.getLocale ()][str]) render.i18n[req.getLocale ()][str] = i18n.__ (str);

      // return rendered
      return render.i18n[req.getLocale ()][str];
    };
  }

  /**
   * remove helper functions
   *
   * @param {Object} render
   */
  _remove (render) {
    // remove helpers
    if (render.helpers) delete render.helpers;
  }
}

/**
 * export locale daemon class
 *
 * @type {locale}
 */
exports = module.exports = locale;
