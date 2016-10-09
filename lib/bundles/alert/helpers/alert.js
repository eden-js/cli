/**
 * Created by Awesome on 3/13/2016.
 */

// use strict
'use strict';

// require dependencies
var config = require ('config');
var helper = require ('helper');
var socket = require ('socket');

/**
 * build socket helper class
 */
class alertHelper extends helper {
    /**
     * construct socket helper class
     */
    constructor () {
        // run super
        super ();

        // bind methods
        this.user = this.user.bind (this);
    }

    /**
     * emits to user
     *
     * @param  {user}   User
     * @param  {String} type
     * @param  {String} message
     * @param  {Object} opts
     */
    user (User, type, message, opts) {
        // create alert object
        var alert = {
            'type'    : type,
            'message' : message
        };

        // set variables
        if (opts) alert.options = opts;

        // emit to redis
        socket.user (User, 'alert', alert);
    }

    /**
     * emits to socket
     *
     * @param  {socket} Socket
     * @param  {String} type
     * @param  {String} message
     * @param  {Object} opts
     */
    socket (Socket, type, message, opts) {
        // create alert object
        var alert = {
            'type'    : type,
            'message' : message
        };

        // set variables
        if (opts) alert.options = opts;

        // emit to socket
        Socket.emit ('alert', alert);
    }
}

/**
 * export alert helper
 *
 * @type {alertHelper}
 */
module.exports = new alertHelper ();
