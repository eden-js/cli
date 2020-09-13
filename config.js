// initialize base config
const baseConfig = {};

// domain/version
baseConfig.port = 1337;
baseConfig.host = '0.0.0.0';
baseConfig.domain = 'eden';
baseConfig.version = '0.1.0';

// title/direction
baseConfig.logo = '/www/public/assets/images/logo.svg';
baseConfig.title = 'EdenJS';
baseConfig.secret = 'someStrongSecretHash';
baseConfig.direction = 1;
baseConfig.environment = 'dev';

// base clusters
baseConfig.clusters = {};

// logging
baseConfig.log = {
  level : 'info',
};

// socket info
baseConfig.socket = {
  url    : `//${baseConfig.domain}`,
  params : {
    reconnect : true,
  },
};

// redis info
baseConfig.redis = {
  host : 'localhost',
  port : 6379,
};

// lock
baseConfig.lock = {
  maxPending : 1000000,
};

// i18n
baseConfig.i18n = {
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
  fallbackLng  : 'en-au',
  lowerCaseLng : true,
};

// asset
baseConfig.asset = {};

// sitemap
baseConfig.sitemap = {
  enabled : true,
};

// database
baseConfig.database = {
  plug   : 'MongoPlug',
  config : {
    db  : baseConfig.domain.split('.')[0],
    url : 'mongodb://localhost:27017',
  },
};

// session
baseConfig.session = {
  key    : `${baseConfig.domain.split('.')[0]}.session.id`,
  cookie : {
    secure   : baseConfig.environment === 'live',
    httpOnly : false,
  },
};

// email
baseConfig.email = {
  service : 'Zoho',
  auth    : {
    user : 'email@domain.com',
    pass : 'superSecretPassword',
  },
};

// includes
baseConfig.frontend = {
  scss : {
    include : [],
  },
  javascript : {
    include     : [],
    browserlist : ['last 3 versions', 'not < 0.25%', 'not dead', 'not ie 11', 'not op_mini all'],
  },
};

// acl
baseConfig.acl = {
  admin   : [],
  default : [],
};

// export base config
module.exports = baseConfig;
