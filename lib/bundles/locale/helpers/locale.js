
// require dependencies
const extend     = require ('extendify');
const helper     = require ('helper');
const backend    = require ('i18next-node-fs-backend');
const sprintf    = require ('i18next-sprintf-postprocessor');
const i18next    = require ('i18next');
const middleware = require ('i18next-express-middleware');

// require local dependencies
const config = require ('config');

// require compiled conf
const compiled = cache ('locale');

/**
 * build locale controller class
 */
class locale extends helper {
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
    this.t     = this.t.bind (this);
    this.build = this.build.bind (this);

    // build
    this.build ();
  }

  /**
   * translates i18n by user
   *
   * @param  {user}   User
   * @param  {String} str
   * @param  {Object} opts
   *
   * @return {String}
   */
  t (User, str, opts) {
    // check opts
    opts = opts || {};

    // set lang
    opts.lng = opts.lang || (User ? (User.get ('lang') || config.get ('i18n.fallbackLng')) : config.get ('i18n.fallbackLng'));

    // check locale
    return this.locale.t (str, opts);
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
    this.locale = i18next
      .use (middleware.LanguageDetector)
      .use (backend)
      .use (sprintf)
      .init (this.extend ({
        'preload' : config.get ('i18n.lngs'),
        'backend' : {
          'loadPath' : global.appRoot + '/app/cache/locales/{{ns}}.{{lng}}.json'
        }
      }, config.get ('i18n') || {}));
  }
}

/**
 * export locale controller class
 *
 * @type {locale}
 */
exports = module.exports = new locale ();
