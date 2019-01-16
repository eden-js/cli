/**
 * Create initial config object
 *
 * @type {Object}
 */
const config = {};


/**
 * Set application page information
 */

// Set application title
config.title = 'EdenJS';
config.direction = 1; // 0 = page only, 1 = title before page title, 2 = title after page title

// Set application domain
config.domain = 'eden';

// Set application version (recommend: semver)
config.version = '0.1.0';

// Set logo
config.logo = '/data/www/public/assets/images/logo.svg';


/**
 * Set application server configuration
 */

// Set app environment
config.environment = 'dev';

// Leave sourcemaps enabled
config.noSourcemaps = false;

// Set local module paths
config.modules = [];

// Set starting port
config.port = 1337;

// Set server host
config.host = '0.0.0.0';

// Set amount of express threads. Setting this as null will count your CPU cores
config.expressThreads = 2;

// Set amount of compute threads. Setting this as null will use 1 compute thread.
// Compute threads are threads used for backend processes
// they do not run the express application, but do run all daemons
config.computeThreads = 2;

// Websocket configuration
config.socket = {
  url    : `//${config.domain}`,
  params : {
    reconnect : true,
  },
};

// Redis configuration
config.redis = {
  host : 'localhost',
  port : 6379,
};

// Lock configuration
config.lock = {
  maxPending : 1000000,
};


// I18n configuration
config.i18n = {
  cache        : {
    prefix         : 'lang_',
    enabled        : true,
    versions       : {},
    expirationTime : 7 * 24 * 60 * 60 * 1000,
  },
  detection    : {
    caches            : ['cookie'],
    lookupCookie      : 'lang',
    lookupQuerystring : 'lang',
  },
  defaultNS    : 'default',
  fallbackNS   : 'default',
  fallbackLng  : 'en-au',
  lowerCaseLng : true,
};

// Add media dir
config.asset = {
  migrate : false, // Migrate media
};

// Create sitemap
config.sitemap = {
  enabled : true,
};

/**
 * Set database configuration
 */

// Set config database object
config.database = {
  plug   : 'MongoPlug', // Can be MongoPlug, RethinkPlug, CouchPlug or ElasticPlug
  config : {
    db  : config.domain.split('.')[0],
    url : 'mongodb://localhost:27017',
  },
};


/**
 * Set email transport configuration
 */

// Set SMTP config email object
config.email = {
  service : 'Zoho',
  auth    : {
    user : 'email@domain.com',
    pass : 'superSecretPassword',
  },
};


/**
 * Set included files
 */

// Set scss imports. These are imported into app.min.css
config.sass = [];

// Set js imports. These are imported into app.min.js at the top
config.js = [];

/**
 * Set application session secret
 */

// Secret for crypto
config.secret = 'someStrongSecretHash';

// Set config session object
config.session = {
  key    : `${config.domain.split('.')[0]}.session.id`,
  cookie : {
    // Setting secure to true allows for secure sessions over HTTPS;
    // if you are not using https then sessions will break
    secure   : false,
    httpOnly : false,
  },
};


/**
 * Set default ACL information
 */

// Set config ACL object
config.acl = {
  // Default ACL for user. This is added by default to every registered user
  default : [
    {
      name  : 'User',
      value : [
        'user.authenticated',
      ],
    },
  ],

  // Default ACL for first user (admin). This ACL is added only to the first user
  admin : [
    {
      name  : 'Admin',
      value : true, // Assigning true to value gives access to everything
    },
  ],
};


/**
 * Set view import functionality
 */

// Set config view object
config.view = {
  engine  : 'riot',
};


/**
 * Set misc settings
 */

// Set log level setting
config.logLevel = config.environment === 'dev' ? 'debug' : 'info';


/**
 * Exports config object
 *
 * @type {Object}
 */
module.exports = config;
