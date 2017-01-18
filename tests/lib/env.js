#!/usr/bin/env node

// use strict
'use strict';

// require dependencies
var os      = require ('os');
var path    = require ('path');
var addPath = require ('app-module-path').addPath;
var winston = require ('winston');

// set global app root
global.appRoot = path.dirname (path.dirname (__dirname));

// add node paths
addPath (global.appRoot);
addPath (global.appRoot + '/lib/core');
addPath (global.appRoot + '/app/bundles');
addPath (global.appRoot + '/lib/bundles');
addPath (global.appRoot + '/lib/aliases');

// require local dependencies
var log    = require ('lib/utilities/log');
var eden   = require ('lib/eden');
var config = require ('app/config');

// set global environment
global.testing     = true;
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
