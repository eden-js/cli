/**
 * Created by Awesome on 2/28/2016.
 */

// use strict
'use strict';

// require dependencies
var co = require ('co');

/**
 * build acl class
 */
class aclUtil {
    /**
     * construct acl class
     */
    constructor() {
        // bind methods
        this.test = this.test.bind (this);

        // bind private methods
        this._userTest = this._userTest.bind (this);
        this._aclTest  = this._aclTest.bind (this);
    }

    /**
     * tests acl
     *
     * @param acl
     * @param User
     * @returns {Promise}
     */
    test (acl, User) {
        // set that
        var that = this;

        // return promise
        return new Promise ((resolve, reject) => {
            // do coroutine
            co (function * () {
                // check user specific acl
                var userTest = that._userTest (acl, User);
                if (userTest !== null) {
                    return resolve (userTest ? true : (acl.fail || false));
                }

                // check and get user acl
                var userAcl = yield User.model ('acl');
                if (!userAcl) {
                    return resolve (acl.fail || false);
                }

                // check for user groups specific acl
                var aclTest = that._aclTest (acl, userAcl);

                // resolve result
                return resolve (aclTest ? true : (acl.fail || false));
            });
        });
    }

    /**
     * tests for user login/logout specific acl
     *
     * @param acl
     * @param User
     *
     * @returns {boolean|null}
     * @private
     */
    _userTest (acl, User) {
        // check if user defined
        if (!User || User === undefined) {
            User = false;
        }

        // check for acl
        if (!acl) {
            return true;
        }

        // check logged in specific acl
        if ((!User && acl.test === false) || (User && acl.test === true)) {
            return true;
        }

        // Check logged out for specific acl
        if ((User && acl.test === false) || (!User && acl.test === true)) {
            return false;
        }

        // check if User
        if (!User) {
            return false;
        }

        // default return null
        return null;
    }

    /**
     * tests for user groups specific acl
     *
     * @param acl
     * @param userAcl
     *
     * @returns {boolean}
     * @private
     */
    _aclTest (acl, userAcl) {
        // set variables
        var can     = false;
        var aclTest = [];

        // loop acl array
        for (var i = 0; i < userAcl.length; i++) {
            // add acl to aclTest array
            aclTest = aclTest.concat (userAcl[i].get ('value'));
        }

        // Return true if acl is admin
        if (aclTest.indexOf (true) > -1) {
            return true;
        }

        // loop all acl
        for (var x = 0; x < acl.test.length; x++) {
            if (aclTest.indexOf (acl.test[x]) > -1) {
                // found the acl required, return true
                can = true;
            } else {
                return false;
            }
        }

        // return found acl
        return can;
    }
}

/**
 * export aclUtil class
 *
 * @type {aclUtil}
 */
module.exports = new aclUtil ();
