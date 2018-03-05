/**
 * create initial config object
 *
 * @type {Object}
 */
const config = {};


/**
 * set application page information
 */

// set application title
config.title = 'EdenJS';

// set application domain
config.domain = 'edenjs.com';

// set application version (recommend: semver)
config.version = '0.1.0';

// set logo
config.logo = '/public/assets/images/logo.svg';


/**
 * set application server configuration
 */

// set app environment
config.environment = 'dev';

// set starting port
config.port = 1337;

// set server host
config.host = '0.0.0.0';

// set amount of express threads to run. setting this as null will count your CPU cores
config.expressThreads = 1;

// set amount of compute threads to run. setting this as null will use 1 compute thread. compute threads are threads
// used for backend processes they do not run the express application, but do run all daemons
config.computeThreads = 1;

// websocket configuration
config.socket = {
  'url'    : `//${config.domain}`,
  'params' : {
    'reconnect' : true
  }
};

// redis configuration
config.redis = {
  'host' : 'localhost',
  'port' : 6379
};

// lock configuration
config.lock = {
  'maxPending' : 1000000
};


// i18n configuration
config.i18n = {
  'cache' : {
    'prefix'         : 'lang_',
    'enabled'        : true,
    'versions'       : {},
    'expirationTime' : 7 * 24 * 60 * 60 * 1000
  },
  'detection' : {
    'caches'            : [ 'cookie' ],
    'lookupCookie'      : 'lang',
    'lookupQuerystring' : 'lang'
  },
  'defaultNS'    : 'default',
  'fallbackNS'   : 'default',
  'fallbackLng'  : 'en-au',
  'lowerCaseLng' : true
};

// add media dir
config.media = {
  'dir' : 'media'
};

// create sitemap
config.sitemap = {
  'enabled' : true
};

/**
 * set database configuration
 */

// set config database object
config.database = {
  'plug'   : 'MongoPlug', // can be MongoPlug, RethinkPlug, CouchPlug or ElasticPlug
  'config' : {
    'db'  : config.domain.split ('.')[0],
    'url' : 'mongodb://localhost:27017'
  }
};


/**
 * set email transport configuration
 */

// set SMTP config email object
config.email = {
  'service' : 'Zoho',
  'auth'    : {
    'user' : 'email@domain.com',
    'pass' : 'superSecretPassword'
  }
};


/**
 * set included files
 */

// set scss imports. thes are imported into app.min.css
config.sass = [
  './node_modules/bootstrap/scss/bootstrap.scss'
];

// set js imports. these are imported into app.min.js at the top
config.js = [
  './node_modules/whatwg-fetch/fetch.js',
  './node_modules/jquery/dist/jquery.min.js',
  './node_modules/popper.js/dist/umd/popper.min.js',
  './node_modules/bootstrap/dist/js/bootstrap.js'
];


/**
 * set application session secret
 */

// secret for crypto
config.secret = 'someStrongSecretHash';

// set config session object
config.session = {
  'key'    : `${config.domain.split ('.')[0]}.session.id`,
  'cookie' : {
    // setting secure to true allows for secure sessions over HTTPS; if you are not using https then sessions will break
    'secure'   : false,
    'httpOnly' : false
  }
};


/**
 * set default ACL information
 */

// set config ACL object
config.acl = {
  // default ACL for user. this is added by default to every registered user
  'default' : [
    {
      'name'  : 'User',
      'value' : [
        'user.authenticated'
      ]
    }
  ],

  // default ACL for first user (admin). this ACL is added only to the first user
  'admin'   : [
    {
      'name'  : 'Admin',
      'value' : true // assigning true to value gives access to everything
    }
  ]
};


/**
 * set view import functionality
 */

// set config view object
config.view = {
  'engine'  : 'riot',
  'include' : {
    'alert'  : 'alert/public/js/bootstrap', // include alert module
    'socket' : 'socket/public/js/bootstrap' // include socket module
  }
};


/**
 * set misc settings
 */

// set log level setting
config.logLevel = config.environment === 'dev' ? 'debug' : 'info';


/**
 * exports config
 *
 * @type {Object}
 */
exports = module.exports = config;
