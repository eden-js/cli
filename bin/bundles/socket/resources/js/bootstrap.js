/**
 * Created by Awesome on 3/13/2016.
 */

// use strict
'use strict';

// require dependencies
var io = require ('socket.io-client');

/**
 * build socket class
 */
class socket {
    /**
     * construct socket class
     */
    constructor () {
        // bind methods
        this.on    = this.on.bind (this);
        this.build = this.build.bind (this);

        // run
        this.build ();
    }

    /**
     * build chat class
     */
    build () {
        // run socket
        // @todo fix this, its pretty insecure
        this.socket = io.connect ('//' + window.eden.domain, {
            query     : 'json=' + encodeURIComponent(JSON.stringify({
                'user' : window.eden.user
            })),
            secure    : true,
            reconnect : true,
            'path'    : '/ws'
        });
    }

    /**
     * run this on
     *
     * @param type
     * @param fn
     */
    on (type, fn) {
        this.socket.on (type, fn);
    }
}

/**
 * export socket class
 *
 * @type {socket}
 */
module.exports = new socket ();