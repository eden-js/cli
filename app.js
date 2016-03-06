#!/usr/bin/env node

// use strict
'use strict';

// require dependencies
var os      = require ('os');
var cluster = require ('cluster');

// set global variables
global.appRoot     = __dirname;
global.envrionment = process.env.NODE_ENV || 'dev';

// set global functions
global.log = require (global.appRoot + '/bin/util/log');

// require local dependencies
var config = require (global.appRoot + '/config');
var daemon = require (global.appRoot + '/bin/util/daemon');

// check if environment
if (global.environment == 'dev') {
    // run in dev
    global.log ('running in development environment', 'server');

    // run single instance
    require (global.appRoot + '/bin/bootstrap');

    // run daemon
    daemon ();
} else {
    // run in production
    global.log ('running in production environment', 'server');

    // check if master
    if (cluster.isMaster) {
        // count CPUs
        var cpuCount = config.threads ? config.threads : os.cpus ().length;

        // create new worker per cpu
        for (var i = 0; i < cpuCount; i += 1) {
            // timeout fork in line
            setTimeout (() => {
                // fork new thread
                cluster.fork ();
            }, (i * 500));
        }

        // run daemon
        daemon ();
    } else {
        // log forked
        global.log ('forked process', 'server');

        // fork boot
        require (global.appRoot + '/bin/bootstrap');
    }

    // set on exit
    cluster.on ('exit', function (worker) {
        // log and replace dead worker
        global.log ('worker ' + worker.id + ' died', 'server');

        // fork new thread
        cluster.fork ();
    });
}