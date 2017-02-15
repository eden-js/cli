
// require environment
require ('../lib/env');

// require dependencies
const winston = require ('winston');

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
  'logger'  : logger,
  'express' : true
});
