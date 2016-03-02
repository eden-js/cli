#!/usr/bin/env node

// require dependencies
var cluster = require ('cluster');
var os      = require ('os');
var config  = require ('./config');

// set environment
global.envrionment = process.env.NODE_ENV || 'dev';

// check if environment
if (global.environment == 'dev') {
    require ('./bin/bootstrap');
} else {
    if (cluster.isMaster) {
        // count CPUs
        var cpuCount = config.threads ? config.threads : os.cpus().length;

        // create new worker per cpu
        for (var i = 0; i < cpuCount; i += 1) {
            cluster.fork();
        }
    } else {
        console.log('[EdenFrame] running new thread');
        require ('./bin/bootstrap');
    }

    // set on exit
    cluster.on('exit', function (worker) {
        // log and replace dead worker
        console.log('[EdenFrame] worker %d died :(', worker.id);
        cluster.fork();
    });
}