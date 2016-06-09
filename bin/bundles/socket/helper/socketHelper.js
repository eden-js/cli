/**
 * Created by Awesome on 3/13/2016.
 */

// use strict
'use strict';

// require dependencies
var redis   = require ('redis');
var config  = require ('config');
var helper  = require ('helper');
var emitter = require ('socket.io-emitter');

// check if socket
var io  = false;
var pub = false;
if (config.socket) {
    io  = emitter ({
        host : '127.0.0.1',
        port : 6379,
        key  : config.domain
    });
    pub = redis.createClient ();
}

/**
 * build socket helper class
 */
class socketHelper extends helper {
    /**
     * construct socket helper class
     */
    constructor (a, b) {
        // run super
        super (a, b);

        // bind methods
        this.room  = this.room.bind (this);
        this.user  = this.user.bind (this);
        this.emit  = this.emit.bind (this);
        this.alert = this.alert.bind (this);
    }

    /**
     * emits to room
     *
     * @param  {String} name
     * @param  {String} type
     * @param  {*}      data
     */
    room (name, type, data) {
        // send to io room
        io.to (name).emit (type, data);
    }

    /**
     * emits to user
     *
     * @param  {user}   User
     * @param  {String} type
     * @param  {*}      data
     */
    user (User, type, data) {
        // emit to socket
        pub.publish (config.domain + ':socket-message', JSON.stringify ({
            'to'   : (User ? User.get ('_id').toString () : true),
            'type' : type,
            'data' : data
        }));
    }

    /**
     * emit information
     *
     * @param type
     * @param data
     * @param User
     */
    emit (type, data) {
        // send everywhere
        io.emit (type, data);
    }

    /**
     * create socketio alert
     *
     * @param  {User}   User
     * @param  {String} message
     * @param  {String} type
     */
    alert (User, message, type, options) {
        // create alert object
        var alert = {
            'type'    : type,
            'message' : message
        };

        // set variables
        if (options) {
            alert.options = options;
        }

        // emit to redis
        this.user (User, 'alert', alert);
    }
}

/**
 * export socket helper
 *
 * @type {socketHelper}
 */
module.exports = new socketHelper ();
