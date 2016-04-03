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
        this.on     = this.on.bind (this);
        this.build  = this.build.bind (this);
        this.cookie = this.cookie.bind (this);

        // run
        this.build ();
    }

    /**
     * build chat class
     */
    build () {
        console.log ('cookie', this.cookie ('eden.session.id'));

        // run socket
        this.socket = io.connect ('//' + window.eden.domain, {
            secure    : true,
            reconnect : true
        });
    }

    /**
     * reads cookie
     *
     * @param  {String} cname
     *
     * @return {String} cookie
     */
    cookie(cname) {
        var name = cname + "=";
        var ca   = document.cookie.split(';');
        for(var i=0; i<ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1);
            if (c.indexOf(name) === 0) return c.substring(name.length,c.length);
        }
        return "";
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
