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
     * @param  {Object} userAcl ACL to check has permissions
     * @param  {Array}  Acl     permissions to match
     * @param  {user}   User
     *
     * @return {*}
     */
    acl (userAcl, Acl, User) {
        // set default Acl
        Acl = Acl || [];

        // check user specific acl
        var userTest = this._userTest (Acl, User);
        if (userTest !== null) {
            return (userTest ? true : (Acl.fail || false));
        }

        // check user acl
        if (!Acl) return (Acl.fail || false);

        // check for user groups specific acl
        var aclTest = this._aclTest (Acl, userAcl);

        // return result
        return (aclTest ? true : (Acl.fail || false));
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
                // set user acl
                var userAcl = User ? yield User.model ('acl') : [];

                // create acl array
                var Acl = [];
                // loop user acl
                for (var i = 0; i < userAcl.length; i++) {
                    // push into acl
                    Acl.push (userAcl[i].sanitise ());
                }

                // resolve test match
                resolve (that.acl (acl, Acl.length ? Acl : false, User));
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
        if (!User || typeof User === 'undefined') {
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
        for (var a = 0; a < userAcl.length; a++) {
            // add acl to aclTest array
            aclTest = aclTest.concat (userAcl[a].value);
        }

        // Return true if acl is admin
        if (aclTest.indexOf (true) > -1) {
            return true;
        }

        // loop all acl
        for (var b = 0; b < acl.test.length; b++) {
            if (aclTest.indexOf (acl.test[b]) > -1) {
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
