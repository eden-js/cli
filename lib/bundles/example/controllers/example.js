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
class example extends controller {
    /**
     * construct example controller class
     *
     * @param {eden} eden
     */
    constructor (eden) {
        // run super eden
        super (eden);
    }
}

/**
 * export module controller
 *
 * @type {example}
 */
module.exports = example;
