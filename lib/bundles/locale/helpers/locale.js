
// Require dependencies
const path       = require('path');
const extend     = require('extendify');
const helper     = require('helper');
const backend    = require('i18next-node-fs-backend');
const i18next    = require('i18next');
const middleware = require('i18next-express-middleware');

// Require local dependencies
const config = require('config');

// Require compiled conf
const compiled = cache('locale');

/**
 * Build locale controller class
 */
class locale extends helper {

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

    // Bind methods
    this.t     = this.t.bind(this);
    this.build = this.build.bind(this);

    // Build
    this.build();
  }

  /**
   * Translates i18n by user
   *
   * @param  {user}   User
   * @param  {String} str
   * @param  {Object} opts
   *
   * @return {String}
   */
  t (User, str, opts) {
    // Check opts
    opts = opts || {};

    // Set lang
    opts.lng = opts.lang || (User ? (User.get('lang') || config.get('i18n.fallbackLng')) : config.get('i18n.fallbackLng'));

    // Check locale
    return this.locale.t(str, opts);
  }

  /**
   * Build locale controller
   */
  build () {
    // Set langs and namespaces
    config.set('i18n.ns',   compiled.namespaces);
    config.set('i18n.lngs', compiled.locales);
    config.set('i18n.cache.versions', {});

    // Set whitelist
    if (config.get('i18n.lngs')) config.set('i18n.whitelist', config.get('i18n.lngs'));

    // Set cache versions for i18n
    for (let i = 0; i < config.get('i18n.lngs').length; i++) {
      // Set versions
      config.set('i18n.cache.versions.' + config.get('i18n.lngs')[i], config.get('version'));
    }

    // Init
    this.locale = i18next
      .use(middleware.LanguageDetector)
      .use(backend)
      .init(this.extend({
        'preload' : config.get('i18n.lngs'),
        'backend' : {
          'loadPath' : path.join(global.appRoot, 'www', 'locales', '{{ns}}.{{lng}}.json')
        }
      }, config.get('i18n') || {}));
  }
}

/**
 * Export locale controller class
 *
 * @type {locale}
 */
exports = module.exports = new locale();
