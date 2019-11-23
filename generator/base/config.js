/**
 * Create initial config Object
 *
 * @type {Object}
 */
const config = {};


/**
 * Set application page information
 */

// Set application title
config.title = '#!name!#';

// Set application domain
config.domain = '#!domain!#';

// Set application version
config.version = '0.1';

// Set logo
config.logo = '/public/assets/images/logo.svg';

// modules
config.ignore = [];
config.modules = [];

/**
 * Set application server configuration
 */

// Set app environment
config.environment = 'dev';

// Set starting port
config.port = #!port!#;

// Set server host
config.host = '0.0.0.0';

// set amount of express threads to run
// setting this as null will count your CPU cores
config.expressThreads = 1;

// set amount of compute threads to run
// setting this as null will use 1 compute thread
// compute threads are threads used for backend processes they do not run
// the express application, but do run all daemons
config.computeThreads = 1;

// Websocket configuration
config.socket = {
  url    : `//#!domain!#`,
  params : {
    reconnect : true,
  },
};

// Redis configuration
config.redis = {
  host : 'localhost',
  port : 6379,
};

// i18n configuration
config.i18n = {
  cache : {
    prefix         : 'lang_',
    enabled        : true,
    versions       : {},
    expirationTime : 7 * 24 * 60 * 60 * 1000,
  },
  detection : {
    caches            : ['cookie'],
    lookupCookie      : 'lang',
    lookupQuerystring : 'lang',
  },
  defaultNS    : 'default',
  fallbackNS   : 'default',
  fallbackLng  : 'en',
  lowerCaseLng : true,
};

// create sitemap
config.sitemap = {
  enabled : true,
};

/**
 * Set database configuration
 */

// Set config database object
config.database = {
  plug   : 'MongoPlug', // can be MongoPlug, RethinkPlug, CouchPlug or ElasticPlug
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
    pass : 'supersecretemailpassword',
  },
};

/**
 * Set included files
 */

// Set scss imports
// These are imported into app.min.css by default
config.sass = [
  
];

// Set js imports
// These are imported into app.min.js at the top
config.js = [
  
];


/**
 * Set application session secret
 */

// Secret for crypto
config.secret = '#!hash!#';

// Secret for session
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

// Set acl object
config.acl = {
  // default acl per user
  // this is added by default to every registered user
  default : [
    {
      name  : 'User',
      value : [
        'user.authenticated',
      ],
    },
  ],
  // default acl for first user (admin)
  // this acl is added only to the first user
  admin : [
    {
      name  : 'Admin',
      value : true, // assigning true to value gives access to everything
    },
  ],
};


/**
 * Set view import functionality
 */

// Create view object
config.view = {
  engine    : 'riot',
  // Modules will be required at the top of riot's tags.min.js
  include : {
    // Include alert module
    alert  : 'alert/public/js/bootstrap',
    // Include socket module
    socket : 'socket/public/js/bootstrap',
  },
  require : [

  ],
};

/**
 * Set misc settings
 */

// Create log level setting
config.logLevel = 'info';

/**
 * Export config
 *
 * @type {Object}
 */
module.exports = config;
