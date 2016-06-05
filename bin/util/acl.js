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
        this.acl  = this.acl.bind (this);
        this.test = this.test.bind (this);

        // bind private methods
        this._userTest = this._userTest.bind (this);
        this._aclTest  = this._aclTest.bind (this);
    }

    /**
     * test match existing acl
     *
     * @param {Object} userAcl ACL to check has permissions
     * @param {Array}  Acl     permissions to match
     * @param {user}   User
     *
     * @return {*}
     */
    acl (userAcl, Acl, User) {
        // set default Acl
        Acl = Acl || [];

        // check user specific acl
        var userTest = this._userTest (Acl, User);
        console.log ('user test', userTest);
        if (userTest !== null) {
            return (userTest ? true : (Acl.fail || false));
        }

        // check user acl
        if (!Acl) return (Acl.fail || false);

        // check for user groups specific acl
        var aclTest = this._aclTest (userAcl, Acl);

        // return result
        return (aclTest ? true : (Acl.fail || false));
    }

    /**
     * tests acl
     *
     * @param {Array}  Acl     permissions to match
     * @param {user}   User
     *
     * @returns {Promise}
     */
    test (Acl, User) {
        // set that
        var that = this;

        // return promise
        return new Promise ((resolve, reject) => {
            // do coroutine
            co (function * () {
                // set user acl
                var test    = [];
                var userAcl = [];

                // check for user
                if (User) test = yield User.model ('acl');

                // loop user acl
                for (var i = 0; i < test.length; i++) {
                    // push into acl
                    userAcl.push (test[i].sanitise ());
                }

                // resolve test match
                resolve (that.acl (userAcl, Acl, User));
            });
        });
    }

    /**
     * tests for user login/logout specific acl
     *
     * @param {Object} Acl   acl to test
     * @param {user}   User
     *
     * @private
     * @returns {boolean|null}
     */
    _userTest (Acl, User) {
        // check if user defined
        if (!User || typeof User === 'undefined') {
            User = false;
        }

        // check for acl
        if (!Acl) {
            return true;
        }

        // check logged in specific acl
        if ((!User && Acl.test === false) || (User && Acl.test === true)) {
            return true;
        }

        // Check logged out for specific acl
        if ((User && Acl.test === false) || (!User && Acl.test === true)) {
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
     * @param {Object} userAcl ACL to check has permissions
     * @param {Object} Acl   acl to test
     *
     * @private
     * @returns {boolean|null}
     */
    _aclTest (userAcl, Acl) {
        // set variables
        var can     = false;
        userAcl     = userAcl || [];
        var aclTest = [];

        // loop acl array
        for (var a = 0; a < userAcl.length; a++) {
            // add acl to aclTest array
            aclTest = aclTest.concat (userAcl[a].value);
        }

        // Return true if acl is admin
        if (aclTest.indexOf (true) > -1) {
            // return true
            return true;
        }

        // loop all acl
        for (var b = 0; b < Acl.test.length; b++) {
            // check if should return true
            if (aclTest.indexOf (Acl.test[b]) > -1) {
                // found the acl required, return true
                return true;
            }
        }

        // return found acl
        return false;
    }
}

/**
 * export aclUtil class
 *
 * @type {aclUtil}
 */
module.exports = new aclUtil ();
