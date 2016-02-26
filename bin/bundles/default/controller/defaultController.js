/**
 * Created by Awesome on 1/30/2016.
 */

// use strict
'use strict';

// require local dependencies
var controller = require(global.appRoot + '/bin/bundles/core/controller');

/**
 * build default controller
 */
class defaultController extends controller {
    /**
     * construct default controller
     *
     * @param props
     */
    constructor(props) {
        super(props);
    }
}

/**
 * export default controller
 *
 * @type {defaultController}
 */
module.exports = defaultController;