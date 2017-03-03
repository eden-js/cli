/**
 * Created by Alex.Taylor on 26/02/2016.
 */

// use strict
'use strict';

// require dependencies
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
      .use (sprintf)
      .use (backend)
      .use (middleware.LanguageDetector)
      .init (extend ({
        'backend' : {
          'addPath'  : global.appRoot + '/app/cache/locales/{{ns}}.{{lng}}.missing.json',
          'loadPath' : global.appRoot + '/app/cache/locales/{{ns}}.{{lng}}.json'
        }
      }, config.i18n));

    // use middleware
    this.eden.router.use (middleware.handle (i18next, {
      removeLngFromUrl: false
    }));

    // use get
    this.eden.router.get ('/locales/resources.json', middleware.getResourcesHandler (i18next));
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
      'resources' : {
        [req.language] : {
          [(config.i18n.defaultNs || 'default')] : require (global.appRoot + '/app/cache/locales/' + (config.i18n.defaultNs || 'default') + '.' + req.language + '.json')
        }
      }
    }, config.i18n);

    // set load url
    render.i18n.backend = {
      'allowMultiLoading' : true
    };

    // set helpers
    if (!render.helpers) render.helpers = {};

    // set helper
    render.helpers.i18n = {
      't' : (str) => {
        // load namespace
        let namespace = config.i18n.defaultNs || 'default';

        // check namespace
        if (str.indexOf (':') > -1) namespace = namespace.split (':')[0];

        // return rendered
        return req.t (str);
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
