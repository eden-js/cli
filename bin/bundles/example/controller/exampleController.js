/**
 * Created by Awesome on 1/30/2016.
 */

// use strict
'use strict';

// require local dependencies
var controller = require ('controller');

/**
 * build example controller
 */
class exampleController extends controller {
    /**
     * construct props
     *
     * @param {*} a
     * @param {*} b
     */
    constructor (a, b) {
        super (a, b);
    }
}

/**
 * export module controller
 *
 * @type {exampleController}
 */
module.exports = exampleController;
