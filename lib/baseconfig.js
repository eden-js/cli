const config = {};

config.title = 'EdenJS';
config.direction = 1;

config.domain = 'eden';
config.version = '0.1.0';

config.environment = 'dev';
config.logLevel = config.environment === 'dev' ? 'debug' : 'info';

config.logo = '/data/www/public/assets/images/logo.svg';

config.noSourcemaps = false;

config.modules = [];

config.port = 1337;
config.host = '0.0.0.0';

config.expressThreads = null;
config.computeThreads = null;

config.socket = {
  url    : `//${config.domain}`,
  params : {
    reconnect : true,
  },
};

config.redis = {
  host : 'localhost',
  port : 6379,
};

config.lock = {
  maxPending : 1000000,
};

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

config.asset = {
  migrate : false,
};

config.sitemap = {
  enabled : true,
};

config.database = {
  plug   : 'MongoPlug',
  config : {
    db  : config.domain.split('.')[0],
    url : 'mongodb://localhost:27017',
  },
};

config.email = {
  service : 'Zoho',
  auth    : {
    user : 'email@domain.com',
    pass : 'superSecretPassword',
  },
};

config.sass = [];
config.js = [];

config.secret = 'someStrongSecretHash';

config.session = {
  key    : `${config.domain.split('.')[0]}.session.id`,
  cookie : {
    secure   : config.environment === 'live',
    httpOnly : false,
  },
};

config.acl = {
  default : [
    {
      name  : 'User',
      value : [
        'user.authenticated',
      ],
    },
  ],

  admin : [
    {
      name  : 'Admin',
      value : true,
    },
  ],
};

module.exports = config;
