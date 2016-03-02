#!/usr/bin/env node

// use strict
'use strict';

// require dependencies
var os      = require ('os');
var path    = require ('path');
var child   = require ('child_process');
var colors  = require ('colors');
var cluster = require ('cluster');

// require local dependencies
var config  = require ('./config');
var daemons = require ('./cache/daemons');

// set global variables
global.appRoot     = __dirname;
global.envrionment = process.env.NODE_ENV || 'dev';

// set global functions
/**
 * create log function
 *
 * @param message
 * @param type
 */
global.log = (message, type, error) => {
    // set date and date padding
    var d = new Date();
    var p = '00';

    // set timestamp strings
    var h = d.getHours() + '';
        h = (h.substring(0, p.length - h.length) + h);
    var m = d.getMinutes() + '';
        m = (m.substring(0, p.length - m.length) + m);
    var s = d.getSeconds() + '';
        s = (s.substring(0, p.length - s.length) + s);

    // set time
    var t = '[' + colors.grey(h + ':' + m + ':' + s) + ']';
    // set framework stamp
    var f = '[' + colors.cyan('EdenFrame') + ']';
    // set type stamp
    var y = (type ? (' [' + (error ? colors.red(type) : colors.green(type)) + ']') : '');

    // actually log
    console.log(t + ' ' + f + y + ' ' + message);
};

// check if environment
if (global.environment == 'dev') {
    // run in dev
    global.log('running in development environment', 'server');

    // run single instance
    require ('./bin/bootstrap');

    // run daemon
    daemon();
} else {
    // run in production
    global.log('running in production environment', 'server');

    // check if master
    if (cluster.isMaster) {
        // count CPUs
        var cpuCount = config.threads ? config.threads : os.cpus().length;

        // create new worker per cpu
        for (var i = 0; i < cpuCount; i += 1) {
            // timeout fork in line
            setTimeout (() => {
                // fork new thread
                cluster.fork();
            }, (i * 500));
        }

        // run daemon
        daemon();
    } else {
        // log forked
        global.log('forked process', 'server');

        // fork boot
        require ('./bin/bootstrap');
    }

    // set on exit
    cluster.on('exit', function (worker) {
        // log and replace dead worker
        log('worker ' + worker.id + ' died', 'server');

        // fork new thread
        cluster.fork();
    });
}

/**
 * daemon function
 */
function daemon () {
    // empty daemon register
    var _daemon = {};

    // loop daemons
    for (var key in daemons) {
        // run daemon
        var name   = daemons[key].split (path.sep);
        name       = name[(name.length - 1)];
        let daemon = name;

        // log daemon
        global.log ('starting daemon ' + daemons[key], 'Daemon');

        // set daemon fork
        _daemon[daemon] = child.fork (global.appRoot + daemons[key]);

        // on message
        _daemon[daemon].on ('message', m => {
            global.log (m, daemon);
        });

        // on exit
        _daemon[daemon].on ('close', (code) => {
            // fork new daemon
            _daemon[daemon] = child.fork (global.appRoot + daemons[key]);
        });
    }
}