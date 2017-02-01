
// require dependencies
const os      = require ('os');
const path    = require ('path');
const addPath = require ('app-module-path').addPath;
const winston = require ('winston');

// set global app root
global.appRoot = path.dirname (path.dirname (__dirname));

// add node paths
addPath (global.appRoot);
addPath (global.appRoot + '/lib/core');
addPath (global.appRoot + '/app/bundles');
addPath (global.appRoot + '/lib/bundles');
addPath (global.appRoot + '/lib/aliases');

// require local dependencies
const log    = require ('lib/utilities/log');
const eden   = require ('lib/eden');
const config = require ('app/config');

// set global environment
global.testing     = true;
global.envrionment = process.env.NODE_ENV || config.environment;

// create logger
const logger = new winston.Logger ({
  level      : 'error',
  transports : [
    new (winston.transports.Console) ({
      colorize  : true,
      formatter : log,
      timestamp : true
    })
  ]
});

// set global logger
global.logger = logger;

// setup eden
global.eden = new eden ({
  'logger' : logger
});
