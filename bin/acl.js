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
    test(acl, User, userAcl) {
        // check if acl required
        if (User == 'undefined' || User == undefined) {
            User = false;
        }
        // check for acl
        if (!acl) {
            return true;
        }
        // check if not user
        if (!User && acl.test === false) {
            return true;
        }
        // check if user
        if (User && acl.test === false) {
            return acl.fail ? acl.fail : false;
        }
        // check if user
        if (!User || !userAcl) {
            return acl.fail ? acl.fail : false;
        }

        // check if user
        userAcl = userAcl.get('value');
        if (userAcl === true) {
            return true;
        }
        // actually check acl
        if (acl && userAcl) {
            for (var i = 0; i < acl.test.length; i++) {
                if (userAcl.indexOf(acl.test[i]) === -1) {
                    return acl.fail ? acl.fail : false;
                }
            }
            return true;
        }
    }
}

/**
 * export acl class
 *
 * @type {acl}
 */
module.exports = new acl();