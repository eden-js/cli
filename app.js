#!/usr/bin/env node

// use strict
'use strict';

// set global app root
global.appRoot = __dirname;

// require dependencies
var os      = require ('os');
var winston = require ('winston');
var cluster = require ('cluster');

// require local dependencies
var log    = require (global.appRoot + '/bin/util/log');
var eden   = require (global.appRoot + '/bin/eden');
var config = require (global.appRoot + '/config');

// set global environment
global.envrionment = process.env.NODE_ENV || config.environment;

// create logger
var logger = new winston.Logger ({
    level      : 'info',
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
    logger.log ('info', 'Running eden in development environment!');

    // run single instance
    new eden ({
      'logger' : logger
    });
} else {
    // check if master
    if (cluster.isMaster) {
        // run in production
        logger.log ('info', 'Running eden in production environment!');

        // count CPUs
        var threads = config.threads ? config.threads : os.cpus ().length;

        // log spawning threads
        logger.log ('info', 'Spawning ' + threads + ' eden thread' + (threads > 1 ? 's' : '') + '!');

        // create new worker per cpu
        for (var i = 0; i < threads; i += 1) {
            // timeout fork in line
            setTimeout (() => {
                // fork new thread
                cluster.fork ();
            }, (i * 500));
        }
    } else {
        // log spawning threads
        logger.log ('info', 'Spawned new eden thread!');

        // run single instance
        new eden ({
          'logger' : logger
        });
    }

    // set on exit
    cluster.on ('exit', function (worker) {
        // log spawning threads
        logger.log ('warning', 'Worker ' + worker.id + ' died, forking new eden thread!');

        // fork new thread
        cluster.fork ();
    });
}
