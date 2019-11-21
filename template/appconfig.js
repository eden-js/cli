/**
 * Create initial config object
 *
 * @type {Object}
 */
const config = {};

// Secret for crypto
config.secret = 'someStrongSecretHash';

config.browserlist = ['last 3 versions', 'not < 0.25%', 'not dead', 'not ie 11', 'not op_mini all'];

config.title = 'EdenJS';
config.direction = 1; // 0 = page only, 1 = title before page title, 2 = title after page title

config.domain = 'eden';
config.version = '0.1.0';

config.environment = 'dev';
config.logLevel = config.environment === 'dev' ? 'debug' : 'info';

config.logo = '/www/public/assets/images/logo.svg';

config.noSourcemaps = false;

config.modules = [];

config.port = 1337;
config.host = '0.0.0.0';

// Set amount of threads. Setting this as null will count your CPU cores
config.expressThreads = 1;
config.computeThreads = 2;

// Lock configuration
config.lock = {
  maxPending : 1000000,
};

// I18n configuration
config.i18n = {
  defaultNS    : 'default',
  fallbackNS   : 'default',
  fallbackLng  : 'en-au',
  lowerCaseLng : true,
};

// Set config database object
config.database = {
  plug   : 'MongoPlug', // Can be MongoPlug, RethinkPlug, CouchPlug or ElasticPlug
  config : {
    db  : config.domain.split('.')[0],
    url : 'mongodb://localhost:27017',
  },
};

// Redis configuration
config.redis = {
  host : 'localhost',
  port : 6379,
};

// Set SMTP config email object
config.email = {
  service : 'Zoho',
  auth    : {
    user : 'email@domain.com',
    pass : 'superSecretPassword',
  },
};

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

module.exports = config;
