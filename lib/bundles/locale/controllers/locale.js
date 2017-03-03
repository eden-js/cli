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
    this._load   = this._load.bind (this);
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
      .use (sprintf)
      .use (backend)
      .use (middleware.LanguageDetector)
      .init (extend ({
        'backend' : {
          'addPath'  : global.appRoot + '/app/cache/locales/{{ns}}.{{lng}}.missing.json',
          'loadPath' : global.appRoot + '/app/cache/locales/{{ns}}.{{lng}}.json'
        },
        'detection' : {
          'caches' : ['cookie']
        }
      }, clone (config.i18n)));

    // use middleware
    this.eden.router.use (middleware.handle (i18next, {
      removeLngFromUrl: false
    }));

    // use get
    this.eden.router.get ('/locales/resources.json', middleware.getResourcesHandler (i18next));
  }

  /**
   * loads langauge pack
   *
   * @param {String} namespace
   * @param {String} lang
   *
   * @return {Object}
   */
  _load (namespace, lang) {
    // set file
    let file = global.appRoot + '/app/cache/locales/' + namespace + '.' + lang + '.json';

    // check exists
    if (!fs.existsSync (file)) return {};

    // return require
    return require (file);
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
      'lng'       : req.language,
      'load'      :'all',
      'backend'   : {
        'loadPath' : '/locales/resources.json?lang={{lng}}&ns={{ns}}'
      },
      'resources' : {
        [req.language] : {
          [(config.i18n.defaultNS || 'default')] : this._load ((config.i18n.defaultNS || 'default'), req.language)
        }
      }
    }, clone (config.i18n));

    // set helpers
    if (!render.helpers) render.helpers = {};

    // set that
    let that = this;

    // set helper
    render.helpers.i18n = {
      /**
       * string functions
       *
       * @param {String} str
       */
      't' : function (str) {
        // load namespace
        let namespace = config.i18n.defaultNS || 'default';

        // check namespace
        if (str.indexOf (':') > -1) namespace = str.split (':')[0];

        // check if in i18n to send
        if (!render.i18n.resources[req.language][namespace]) {
          render.i18n.resources[req.language][namespace] = that._load (namespace, req.language);
        }

        // return rendered
        return req.t.apply (req.t, arguments);
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
