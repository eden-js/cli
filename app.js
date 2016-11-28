#!/usr/bin/env node

// use strict
'use strict';

// set global app root
global.appRoot = __dirname;

// require dependencies
var os      = require ('os');
var addPath = require ('app-module-path').addPath;
var winston = require ('winston');
var cluster = require ('cluster');

// add node paths
addPath (global.appRoot);
addPath (global.appRoot + '/lib/core');
addPath (global.appRoot + '/app/bundles');
addPath (global.appRoot + '/lib/bundles');
addPath (global.appRoot + '/lib/aliases');
addPath (global.appRoot + '/lib/utilities');

// require local dependencies
var log    = require ('lib/utilities/log');
var eden   = require ('lib/eden');
var config = require ('app/config');

// set global environment
global.envrionment = process.env.NODE_ENV || config.environment;

// create logger
var logger = new winston.Logger ({
  level      : config.logLevel  || 'info',
  transports : [
  new (winston.transports.Console) ({
    colorize  : true,
    formatter : log,
    timestamp : true
  })
  ]
});

// check if environment
if (global.environment == 'dev') {
  // run in dev
  logger.log ('info', 'Running eden in development environment');

  // run single instance
  new eden ({
    'logger' : logger
  });
} else {
  // set workers
  var workers = {};

  // check if master
  if (cluster.isMaster) {
    // run in production
    logger.log ('info', 'Running eden in production environment');

    // count CPUs
    var threads = config.threads ? config.threads : os.cpus ().length;

    // log spawning threads
    logger.log ('info', 'Spawning ' + threads + ' eden thread' + (threads > 1 ? 's' : '') + '!');

    // create new worker per cpu
    for (var i = 0; i < threads; i += 1) {
      // creat environment info
      let env = JSON.parse (JSON.stringify (process.env));
          env.id   = i;
          env.port = parseInt (config.port) + i;

      // timeout fork in line
      setTimeout (() => {
        // fork new thread
        workers[i] = cluster.fork (env);
        workers[i].process.env = env;
      }, (i * 500));
    }
  } else {
    // log spawning threads
    logger.log ('info', 'Spawned new eden thread');

    // run single instance
    new eden ({
      'logger' : logger
    });
  }

  // set on exit
  cluster.on ('exit', function (worker) {
    // set i
    var i = worker.process.env.id;

    // creat environment info
    let env = JSON.parse (JSON.stringify (process.env));
        env.port = parseInt (config.port) + i;

    // log spawning threads
    logger.log ('warning', 'Worker ' + worker.id + ' died, forking new eden thread');

    // fork new thread
    worker[i] = cluster.fork (env);
    workers[i].process.env = env;
  });
}
