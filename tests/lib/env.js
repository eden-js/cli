#!/usr/bin/env node

// use strict
'use strict';

// require dependencies
var os      = require ('os');
var path    = require ('path');
var winston = require ('winston');

// set global app root
global.appRoot = path.dirname (path.dirname (__dirname));

// require local dependencies
var log    = require (global.appRoot + '/lib/utilities/log');
var eden   = require (global.appRoot + '/lib/eden');
var config = require (global.appRoot + '/app/config');

// set global environment
global.envrionment = process.env.NODE_ENV || config.environment;

// create logger
var logger = new winston.Logger ({
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
