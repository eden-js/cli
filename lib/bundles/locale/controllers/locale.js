
// require dependencies
const config     = require ('config');
const extend     = require ('extendify');
const controller = require ('controller');
const middleware = require ('i18next-express-middleware');

// require helpers
const locale = helper ('locale');

/**
 * build locale controller class
 *
 * @priority 100
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
    this._socket     = this._socket.bind (this);
    this._middleware = this._middleware.bind (this);

    // build
    this.building = this.build ();
  }

  /**
   * build locale controller
   */
  build () {
    // run this
    this.eden.pre  ('view.render', this._create);
    this.eden.post ('view.render', this._remove);

    // hooks
    this.eden.pre ('socket.call.opts',     this._socket);
    this.eden.pre ('socket.endpoint.opts', this._socket);

    // use middleware
    this.eden.router.use (middleware.handle (locale.locale));

    // add middleware
    this.eden.router.use (this._middleware);

    // use get
    this.eden.router.get ('/locales/:lng/:ns.json', (req, res) => {
      // run try/catch
      try {
        // require locales
        res.json (require (global.appRoot + '/app/cache/locales/' + req.params.ns + '.' + req.params.lng + '.json'));
      } catch (e) {
        // return nothing
        res.json ({});
      }
    });
  }

  /**
   * sets session language
   *
   * @param  {String} lang
   * @param  {Object} opts
   *
   * @call lang
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
      'lng'      : req.language.split (' ')[req.language.split (' ').length - 1],
      'load'     : 'currentOnly',
      'defaults' : {},
      'backend'  : {
        'backends'       : [],
        'backendOptions' : [config.get ('i18n.cache'), {
          'loadPath'          : '/locales/{{lng}}/{{ns}}.json',
          'allowMultiLoading' : false
        }]
      }
    }, config.get ('i18n') || {});

    // set helpers
    if (!render.helpers) render.helpers = {};

    // set helper
    render.helpers.i18n = {
      // return helper translate function
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
   * socket middleware
   *
   * @param  {Object} opts
   */
  _socket (opts) {
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
   *
   * @return {*}
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
