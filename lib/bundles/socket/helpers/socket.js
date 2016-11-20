/**
 * Created by Awesome on 3/13/2016.
 */

// use strict
'use strict';

// require dependencies
var helper = require ('helper');

// require local dependencies
var config = require ('app/config');

/**
 * build socket helper class
 */
class socket extends helper {
    /**
     * construct socket helper class
     */
    constructor () {
        // run super
        super ();

        // bind methods
        this.room  = this.room.bind (this);
        this.user  = this.user.bind (this);
        this.emit  = this.emit.bind (this);
        this.alert = this.alert.bind (this);
    }

    /**
     * emits to room
     *
     * @param  {String}  name
     * @param  {String}  type
     * @param  {*}       data
     */
    room (name, type, data) {
        // emit to socket
        this.eden.emit ('socket:room', {
            'room' : name,
            'type' : type,
            'data' : data
        });
    }

    /**
     * emits to user
     *
     * @param  {user}    User
     * @param  {String}  type
     * @param  {*}       data
     */
    user (User, type, data) {
        // emit to socket
        this.eden.emit ('socket:user', {
            'to'   : (User ? User.get ('_id').toString () : true),
            'type' : type,
            'data' : data
        }, true);
    }

    /**
     * emit information
     *
     * @param  {String}  type
     * @param  {*}       data
     * @param  {user}    User
     */
    emit (type, data) {
        // emit to socket
        this.eden.emit ('socket:emit', {
            'type' : type,
            'data' : data
        });
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
 * @type {socket}
 */
module.exports = new socket ();
