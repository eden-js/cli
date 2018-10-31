
// Require dependencies
const config     = require('config');
const extend     = require('extendify');
const controller = require('controller');
const middleware = require('i18next-express-middleware');

// Require helpers
const locale = helper('locale');

/**
 * Build locale controller class
 *
 * @priority 100
 */
class localeController extends controller {

  /**
   * Construct locale controller class
   */
  constructor () {
    // Run super
    super();

    // Bind variables
    this.extend = extend({
      'isDeep'  : true,
      'inPlace' : false
    });
    this.sessions = {};

    // Bind methods
    this.build = this.build.bind(this);

    // Bind private methods
    this._create     = this._create.bind(this);
    this._remove     = this._remove.bind(this);
    this._socket     = this._socket.bind(this);
    this._middleware = this._middleware.bind(this);

    // Build
    this.building = this.build();
  }

  /**
   * Build locale controller
   */
  build () {
    // Run this
    this.eden.pre('view.render', this._create);
    this.eden.post('view.render', this._remove);

    // Hooks
    this.eden.pre('socket.call.opts',     this._socket);
    this.eden.pre('socket.endpoint.opts', this._socket);

    // Use middleware
    this.eden.router.use(middleware.handle(locale.locale));

    // Add middleware
    this.eden.router.use(this._middleware);

    // Use get
    this.eden.router.get('/locales/:ns.:lng.json', (req, res) => {
      // Run try/catch
      try {
        // Require locales
        res.json(require(global.appRoot + '/cache/locales/' + req.params.ns + '.' + req.params.lng + '.json'));
      } catch (e) {
        // Return nothing
        res.json({});
      }
    });
  }

  /**
   * Sets session language
   *
   * @param  {String} lang
   * @param  {Object} opts
   *
   * @call lang
   */
  langAction (lang, opts) {
    // Get session ID
    let sessionID = opts.socket.request.cookie[config.get('session.key') || 'eden.session.id'];

    // Set language
    this.sessions[sessionID] = lang;
  }

  /**
   * Create helper functions
   *
   * @param {Object} obj
   */
  _create (obj) {
    // Let render
    let req    = obj.req;
    let render = obj.render;

    // Set language
    req.language = req.language || config.get('i18n.fallbackLng');

    // Set i18n variables
    if (!render.i18n) render.i18n = this.extend({
      'lng'      : req.language.split(' ')[req.language.split(' ').length - 1],
      'load'     : 'currentOnly',
      'defaults' : {},
      'backend'  : {
        'backends'       : [],
        'backendOptions' : [config.get('i18n.cache'), {
          'loadPath'          : '/locales/{{ns}}.{{lng}}.json',
          'queryStringParams' : {
            'v' : config.get('version')
          },
          'allowMultiLoading' : false
        }]
      }
    }, config.get('i18n') || {});

    // Set helpers
    if (!render.helpers) render.helpers = {};

    // Set helper
    render.helpers.i18n = {
      // Return helper translate function
      't' : function () {
        // Let key
        let key = JSON.stringify(arguments);

        // Set defaults
        if (!render.i18n.defaults[key]) render.i18n.defaults[key] = req.i18n.t(...arguments);

        // Return rendered
        return render.i18n.defaults[key];
      }
    };
  }

  /**
   * Socket middleware
   *
   * @param  {Object} opts
   */
  _socket (opts) {
    // Add opts
    opts.t = (str, data) => {
      // Check opts
      data = data || {};

      // Get session ID
      let sessionID = opts.socket.request.cookie[config.get('session.key') || 'eden.session.id'];

      // Get language
      if (this.sessions[sessionID]) {
        // Set lang
        data.lng = this.sessions[sessionID];
      }

      // Return helper translate
      return locale.t(opts.user, str, data);
    };
  }

  /**
   * Remove helper functions
   *
   * @param {Object} obj
   */
  _remove (obj) {
    // Remove helpers
    if (obj.render.helpers) delete obj.render.helpers;
  }

  /**
   * Add language middleware
   *
   * @param {Request}  req
   * @param {Response} res
   * @param {Function} next
   *
   * @return {*}
   */
  async _middleware (req, res, next) {
    // Set user language
    if (!req.user) return next();

    // Check user
    if (!req.user.get('lang') || req.user.get('lang') !== req.language) {
      // Lock user
      await req.user.lock();

      // Set language
      req.user.set('lang', req.language.split(' ')[req.language.split(' ').length - 1]);

      // Save user
      await req.user.save();

      // Unlock user
      req.user.unlock();
    }

    // Return next
    return next();
  }
}

/**
 * Export localeController controller class
 *
 * @type {localeController}
 */
exports = module.exports = localeController;
