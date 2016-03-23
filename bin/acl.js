/**
 * Created by Awesome on 2/28/2016.
 */

    // use strict
'use strict';

// require dependencies
var co = require ('co');

// require local dependencies
var model = require (global.appRoot + '/bin/bundles/user/model/acl');

/**
 * build acl class
 */
class acl {
    /**
     * tests acl
     *
     * @param acl
     * @param User
     * @returns {Promise}
     */
    test (acl, User) {
        return new Promise ((resolve, reject) => {
            co (function * () {
                // check if acl required
                if (!User || User === undefined) {
                    User = false;
                }
                // check for acl
                if (!acl) {
                    return resolve (true);
                }
                // check if not user
                if ((!User && acl.test === false) || (User && acl.test === true)) {
                    return resolve (true);
                }
                // check if user
                if ((User && acl.test === false) || (!User && acl.test === true)) {
                    return resolve (acl.fail || false);
                }
                // check if user
                if (!User) {
                    return resolve (acl.fail || false);
                }

                // check get acl
                var userAcl = yield User.model ('acl');
                if (!userAcl) {
                    return resolve (acl.fail || false);
                }

                // check if user
                var can = false;
                // loop acl array
                for (var i = 0; i < userAcl.length; i++) {
                    // run acl test
                    var aclTest = userAcl[i].get ('value');

                    // check if all
                    if (aclTest === true) {
                        return resolve (true);
                    }

                    // loop individual acl
                    for (var x = 0; x < acl.test.length; x++) {
                        if (aclTest.indexOf (acl.test[x]) > -1) {
                            can = true;
                        }
                    }
                }

                // check if acl found
                if (can) {
                    return resolve (true);
                }

                // perform default resolve
                return resolve (acl.fail || false);
            });
        });
    }
}

/**
 * export acl class
 *
 * @type {acl}
 */
module.exports = new acl ();
