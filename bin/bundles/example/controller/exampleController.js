/**
 * Created by Awesome on 1/30/2016.
 */

// use strict
'use strict';

// require local dependencies
var controller = require(global.appRoot + '/bin/bundles/core/controller');

/**
 * build example controller
 */
class exampleController extends controller {
    /**
     * construct props
     *
     * @param props
     */
    constructor(props) {
        super(props);
    }
}

/**
 * export module controller
 *
 * @type {exampleController}
 */
module.exports = exampleController;