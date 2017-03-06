/**
 * Created by Alex.Taylor on 26/02/2016.
 */

// use strict
'use strict';

// require dependencies
const fs         = require ('fs-extra');
const clone      = require ('clone');
const extend     = require ('object-extend');
const backend    = require ('i18next-node-fs-backend');
const sprintf    = require ('i18next-sprintf-postprocessor');
const i18next    = require ('i18next');
const controller = require ('controller');
const middleware = require ('i18next-express-middleware');

// require local dependencies
const config = require ('app/config');

/**
 * build locale controller class
 */
class locale extends controller {
  /**
   * construct locale controller class
   */
  constructor () {
    // run super eden
    super ();

    // bind methods
    this.build = this.build.bind (this);

    // bind private methods
    this._create = this._create.bind (this);
    this._remove = this._remove.bind (this);

    // run this
    this.eden.pre  ('view.render', this._create);
    this.eden.post ('view.render', this._remove);

    // build
    this.build ();
  }

  /**
   * build locale controller
   */
  build () {
    // init
    i18next
      .use (middleware.LanguageDetector)
      .use (backend)
      .use (sprintf)
      .init (extend ({
        'backend' : {
          'loadPath' : global.appRoot + '/app/cache/locales/{{ns}}.{{lng}}.json'
        }
      }, clone (config.i18n)));

    // use middleware
    this.eden.router.use (middleware.handle (i18next));

    // use get
    this.eden.router.get ('/locales/resources', middleware.getResourcesHandler (i18next, {
      'lngParam' : (config.i18n.lngParam || 'lang')
    }));
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
    if (!render.i18n) render.i18n = extend ({
      'lng'      : req.language.split (' ')[req.language.split (' ').length - 1],
      'load'     : 'currentOnly',
      'backend'  : {
        'loadPath'          : '/locales/resources?lang={{lng}}&ns={{ns}}',
        'allowMultiLoading' : true
      },
      'defaults' : {}
    }, clone (config.i18n));

    // set helpers
    if (!render.helpers) render.helpers = {};

    // set helper
    render.helpers.i18n = {
      /**
       * string functions
       *
       * @param {String} str
       */
      't' : function (str) {
        // let key
        let key = JSON.stringify (arguments);

        // set defaults
        if (!render.i18n.defaults[key]) render.i18n.defaults[key] = req.i18n.t.apply (req.i18n, arguments);

        // return rendered
        return render.i18n.defaults[key];
      }
    };
  }

  /**
   * remove helper functions
   *
   * @param {Object} obj
   */
  _remove (obj) {
    // remove helpers
    if (obj.render.helpers) delete obj.render.helpers;
  }
}

/**
 * export locale controller class
 *
 * @type {locale}
 */
exports = module.exports = locale;
