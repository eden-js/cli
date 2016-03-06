/**
 * Created by Awesome on 2/28/2016.
 */

// use strict
'use strict';

// require local dependencies
var model = require(global.appRoot + '/bin/bundles/user/model/acl');

/**
 * build acl class
 */
class acl {
    /**
     * tests acl
     *
     * @param acl
     * @param User
     * @returns {*}
     */
    test(acl, User) {
        // check if acl required
        if (User == 'undefined' || User == undefined) {
            User = false;
        }
        // check for acl
        if (!acl) {
            return true;
        }
        // check if not user
        if (!User && acl.test === false || User && acl.test === true) {
            return true;
        }
        // check if user
        if (User && acl.test === false || !User && acl.test === true) {
            return acl.fail ? acl.fail : false;
        }
        // check if user
        if (!User) {
            return acl.fail ? acl.fail : false;
        }

        // check get acl
        var userAcl = User.model('acl');
        if (!userAcl) {
            return acl.fail ? acl.fail : false;
        }

        // check if user
        var can     = false;
        // loop acl array
        for (var i = 0; i < userAcl.length; i++) {
            // run acl test
            var aclTest = userAcl[i].get('value');

            // check if all
            if (aclTest === true) {
                return true;
            }

            // loop individual acl
            for (var x = 0; x < acl.test.length; x++) {
                if (aclTest.indexOf(acl.test[x]) > -1) {
                    can = true;
                }
            }
        }

        // check if acl found
        if (can) {
            return true;
        } else {
            return acl.fail ? acl.fail : false;
        }
    }
}

/**
 * export acl class
 *
 * @type {acl}
 */
module.exports = new acl();