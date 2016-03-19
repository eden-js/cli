/**
 * Created by Alex.Taylor on 2/03/2016.
 */

// use strict
'use strict';

// require dependencies
var child = require ('child_process');
var path  = require ('path');

// require local dependencies
var daemons = require (global.appRoot + '/cache/daemons');

/**
 * export daemons function
 */
module.exports = () => {
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
            if (global.environment == 'dev') {
              return false;
            }
            _daemon[daemon] = child.fork (global.appRoot + daemons[key]);
        });
    }
};
