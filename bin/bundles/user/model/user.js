/**
 * Created by Awesome on 2/23/2016.
 */

// use strict
'use strict';

// require dependencies
var crypto    = require('crypto');
var mongorito = require('mongorito');

// require local dependencies
var config = require(global.appRoot + '/config');
var acl    = require(global.appRoot + '/bin/bundles/user/model/acl');

/**
 * create user entity
 */
class user extends mongorito.Model {
    /**
     * check ACL before save
     */
    configure() {
        this.before('create', 'checkAcl');
    }

    /**
     * authenticates user
     *
     * @param pass
     * @returns {Promise}
     */
    authenticate(pass) {
        var that = this;

        return new Promise((resolve, reject) => {
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
        });
    }

    /**
     * check ACL
     *
     * @param next
     */
    * checkAcl(next) {
        var that = this;

        // check default acl
        var def = yield acl.where({
            'name' : config.acl.default.name
        }).findOne();
        // check default acl exists
        if (!def) {
            def = new acl(config.acl.default);
            yield def.save();
        }
        // set user acl
        that.set('acl', def);

        // check first
        var count = yield user.count();
        if (!count) {
            // check first acl
            var adm = yield acl.where({
                'name' : config.acl.first.name
            }).findOne();
            // check first acl exists
            if (!adm) {
                adm = new acl(config.acl.first);
                yield adm.save();
            }
            // set user acl
            that.set('acl', adm);
        }

        // run next
        yield next;
    }
}

/**
 * export user model
 * @type {user}
 */
module.exports = user;