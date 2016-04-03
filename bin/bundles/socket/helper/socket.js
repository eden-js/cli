/**
 * Created by Awesome on 3/13/2016.
 */

    // use strict
'use strict';

// require dependencies
var pub = require ('redis').createClient ();

// require local dependencies
var config = require (global.appRoot + '/config');

/**
 * build socket helper class
 */
class socketHelper {
    /**
     * construct socket helper class
     */
    constructor () {
        this.emit  = this.emit.bind (this);
        this.alert = this.alert.bind (this);
    }

    /**
     * emit information
     *
     * @param type
     * @param data
     * @param User
     */
    emit (type, data, User) {
        // publish information to redis pub/sub to send to socket daemon
        pub.publish (config.title + ':socket', JSON.stringify ({
            'to'   : (User ? User.get ('_id').toString () : true),
            'type' : type,
            'data' : data
        }));
    }

    /**
     * create socketio alert
     *
     * @param  {User}   User
     * @param  {String} message
     * @param  {String} type
     */
    alert (User, message, type) {
        // emit to redis
        this.emit ('alert', {
            'type'    : type,
            'message' : message
        }, User);
    }
}

/**
 * export socket helper
 *
 * @type {socketHelper}
 */
module.exports = new socketHelper ();
