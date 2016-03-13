/**
 * Created by Awesome on 3/13/2016.
 */

// use strict
'use strict';

// require dependencies
var io = require ('socket.io-client');

/**
 * build chat class
 */
class chat {
    /**
     * construct chat class
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
        this.socket = io.connect ('//' + window.eden.domain, {
            secure    : true,
            reconnect : true,
            'path'    : '/socket.io'
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
 * export chat class
 *
 * @type {chat}
 */
module.exports = new chat ();