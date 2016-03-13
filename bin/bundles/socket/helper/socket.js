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
        this.emit = this.emit.bind (this);
    }

    /**
     * emit information
     *
     * @param type
     * @param data
     * @param user
     */
    emit (type, data, user) {
        // publish information to redis pub/sub to send to socket daemon
        pub.publish (config.title + ':socket', JSON.stringify ({
            'to'   : (user ? user.get ('_id').toString () : true),
            'type' : type,
            'data' : data
        }));
    }
}

/**
 * export socket helper
 *
 * @type {socketHelper}
 */
module.exports = new socketHelper ();