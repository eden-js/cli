/**
 * Created by Awesome on 2/28/2016.
 */

// use strict
'use strict';

// require local dependencies
var model = require (global.appRoot + '/bin/bundles/core/model');

/**
 * create acl model
 */
class acl extends model {
    /**
     * construct acl model
     *
     * @param a
     * @param b
     */
    constructor(a, b) {
        super(a, b);

        // set model location
        this._modelLocation = __filename.replace (global.appRoot, '');
    }
}

/**
 * export acl model
 * @type {acl}
 */
module.exports = acl;
