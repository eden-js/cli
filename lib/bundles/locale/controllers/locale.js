
// require dependencies
const extend     = require ('extendify');
const backend    = require ('i18next-node-fs-backend');
const sprintf    = require ('i18next-sprintf-postprocessor');
const i18next    = require ('i18next');
const controller = require ('controller');
const middleware = require ('i18next-express-middleware');

// require local dependencies
const config = require ('config');

// require compiled conf
const compiled = cache ('locale');

/**
 * build locale controller class
 */
class locale extends controller {
  /**
   * construct locale controller class
   */
  constructor () {
    // run super
    super ();

    // bind variables
    this.extend = extend ({
      'isDeep'  : true,
      'inPlace' : false
    });

    // bind methods
    this.build = this.build.bind (this);

    // bind private methods
    this._create     = this._create.bind (this);
    this._remove     = this._remove.bind (this);
    this._middleware = this._middleware.bind (this);

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
    // set langs and namespaces
    config.set ('i18n.ns',   compiled.namespaces);
    config.set ('i18n.lngs', compiled.locales);
    config.set ('i18n.cache.versions', {});

    // set whitelist
    if (config.get ('i18n.lngs')) config.set ('i18n.whitelist', config.get ('i18n.lngs'));

    // set cache versions for i18n
    for (var i = 0; i < config.get ('i18n.lngs').length; i++) {
      // set versions
      config.set ('i18n.cache.versions.' + config.get ('i18n.lngs')[i], config.get ('version'));
    }

    // init
    i18next
      .use (middleware.LanguageDetector)
      .use (backend)
      .use (sprintf)
      .init (this.extend ({
        'preload' : config.get ('i18n.lngs'),
        'backend' : {
          'loadPath' : global.appRoot + '/app/cache/locales/{{ns}}.{{lng}}.json'
        }
      }, config.get ('i18n') || {}));

    // use middleware
    this.eden.router.use (middleware.handle (i18next));

    // add middleware
    this.eden.router.use (this._middleware);

    // use get
    this.eden.router.get ('/locales/resources', middleware.getResourcesHandler (i18next, {
      'lngParam' : (config.get ('i18n.lngParam') || 'lang')
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
    if (!render.i18n) render.i18n = this.extend ({
      'lng'     : req.language.split (' ')[req.language.split (' ').length - 1],
      'load'    : 'currentOnly',
      'backend' : {
        'loadPath'          : '/locales/resources?lang={{lng}}&ns={{ns}}',
        'allowMultiLoading' : true
      },
      'defaults' : {}
    }, config.get ('i18n') || {});

    // set helpers
    if (!render.helpers) render.helpers = {};

    // set helper
    render.helpers.i18n = {
      /**
       * string functions
       *
       * @param {String} str
       */
      't' : function () {
        // let key
        let key = JSON.stringify (arguments);

        // set defaults
        if (!render.i18n.defaults[key]) render.i18n.defaults[key] = req.i18n.t (...arguments);

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

  /**
   * add language middleware
   *
   * @param {Request}  req
   * @param {Response} res
   * @param {Function} next
   */
  async _middleware (req, res, next) {
    // set user language
    if (!req.user) return next ();

    // check user
    if (!req.user.get ('lang') || req.user.get ('lang') !== req.language) {
      // set language
      req.user.set ('lang', req.language.split (' ')[req.language.split (' ').length - 1]);

      // save user
      await req.user.save ();
    }

    // return next
    return next ();
  }
}

/**
 * export locale controller class
 *
 * @type {locale}
 */
exports = module.exports = locale;
