/**
 * Created by Awesome on 2/23/2016.
 */

// use strict
'use strict';

// require dependencies
var co        = require('co');
var crypto    = require('crypto');
var mongorito = require('mongorito');

// require local dependencies
var config = require(global.appRoot + '/config');

/**
 * create user entity
 */
class user extends mongorito.Model {
    /**
     * authenticates user
     *
     * @param pass
     * @returns {Promise}
     */
    authenticate(pass) {
        var that = this;

        return new Promise((resolve, reject) => {
            co(function * () {
                // compare hash with password
                var hash  = that.get('hash');
                var check = crypto
                    .createHmac('sha256', config.secret)
                    .update(pass)
                    .digest('hex');

                // check if password correct
                if (check !== hash) {
                    return resolve({
                        'error' : true,
                        'mess'  : 'Incorrect password'
                    });
                }

                // password accepted
                resolve({
                    'error' : false
                });
            })
        });
    }
}

/**
 * export user model
 * @type {user}
 */
module.exports = user;