function deffed(v1, v2) {
  return v1 !== undefined && v1 !== null ? v1 : v2;
}

function getBaseConfig(config) {
  const baseConfig = {};

  baseConfig.browserlist = ['last 3 versions', 'not < 0.25%', 'not dead', 'not ie 11', 'not op_mini all'];

  baseConfig.title = 'EdenJS';
  baseConfig.direction = 1;

  baseConfig.domain = 'eden';
  baseConfig.version = '0.1.0';

  baseConfig.environment = 'dev';
  baseConfig.logLevel = deffed(config.get('environment'), baseConfig.environment) === 'dev' ? 'debug' : 'info';

  baseConfig.logo = '/data/www/public/assets/images/logo.svg';

  baseConfig.noSourcemaps = false;

  baseConfig.modules = [];

  baseConfig.port = 1337;
  baseConfig.host = '0.0.0.0';

  baseConfig.expressThreads = null;
  baseConfig.computeThreads = null;

  baseConfig.socket = {
    url    : `//${deffed(config.get('domain'), baseConfig.domain)}`,
    params : {
      reconnect : true,
    },
  };

  baseConfig.redis = {
    host : 'localhost',
    port : 6379,
  };

  baseConfig.lock = {
    maxPending : 1000000,
  };

  baseConfig.i18n = {
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

  baseConfig.asset = {
    migrate : false,
  };

  baseConfig.sitemap = {
    enabled : true,
  };

  baseConfig.database = {
    plug   : 'MongoPlug',
    config : {
      db  : deffed(config.get('domain'), baseConfig.domain).split('.')[0],
      url : 'mongodb://localhost:27017',
    },
  };

  baseConfig.email = {
    service : 'Zoho',
    auth    : {
      user : 'email@domain.com',
      pass : 'superSecretPassword',
    },
  };

  baseConfig.sass = [];
  baseConfig.js = [];

  baseConfig.secret = 'someStrongSecretHash';

  baseConfig.session = {
    key    : `${deffed(config.get('domain'), baseConfig.domain).split('.')[0]}.session.id`,
    cookie : {
      secure   : deffed(config.get('environment'), baseConfig.environment) === 'live',
      httpOnly : false,
    },
  };

  baseConfig.acl = {
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

  return baseConfig;
}

module.exports = getBaseConfig;
