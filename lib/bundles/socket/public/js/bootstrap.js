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
        this.on  = this.on.bind (this);
        this.off = this.off.bind (this);

        // run socket
        this.socket = io.connect (window.eden.socket.url, window.eden.socket.params);
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

    /**
     * off function
     *
     * @param type
     * @param fn
     */
    off (type, fn) {
        this.socket.off (type, fn);
    }

    /**
     * emits to socket
     *
     * @param  {String} type
     * @param  {*}      data
     */
    emit (type, data) {
        this.socket.emit (type, data);
    }
}

// build socket class
window.eden.socket = new socket ();

/**
 * export socket class
 *
 * @type {socket}
 */
module.exports  = window.eden.socket;
