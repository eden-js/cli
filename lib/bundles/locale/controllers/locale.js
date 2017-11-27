
// require dependencies
const config     = require ('config');
const extend     = require ('extendify');
const controller = require ('controller');
const middleware = require ('i18next-express-middleware');

// require helpers
const locale = helper ('locale');

/**
 * build locale controller class
 */
class localeController extends controller {
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
    this.sessions = {};

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
    // use middleware
    this.eden.router.use (middleware.handle (locale.locale));

    // add middleware
    this.eden.router.use (this._middleware);

    // pre socket
    this.eden.pre ('socket.call.opts', (opts) => {
      // add opts
      opts.t = (str, data) => {
        // check opts
        data = data || {};

        // get session ID
        let sessionID = opts.socket.request.cookie[config.get ('session.key') || 'eden.session.id'];

        // get language
        if (this.sessions[sessionID]) {
          // set lang
          data.lng = this.sessions[sessionID];
        }

        // return helper translate
        return locale.t (opts.user, str, data);
      };
    });

    // use get
    this.eden.router.get ('/locales/resources', middleware.getResourcesHandler (locale.locale, {
      'lngParam' : (config.get ('i18n.lngParam') || 'lang')
    }));
  }

  /**
   * sets session language
   *
   * @param  {String} lang
   * @param  {Object} opts
   *
   * @call   lang
   * @return {*}
   */
  langAction (lang, opts) {
    // get session ID
    let sessionID = opts.socket.request.cookie[config.get ('session.key') || 'eden.session.id'];

    // set language
    this.sessions[sessionID] = lang;
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

    // set language
    req.language = req.language || config.get ('i18n.fallbackLng');

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
 * export localeController controller class
 *
 * @type {localeController}
 */
exports = module.exports = localeController;
