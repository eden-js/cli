/**
 * Created by Alex.Taylor on 26/02/2016.
 */

// use strict
'use strict';

// require local dependencies
var daemon = require ('daemon');

/**
 * build example dameon class
 */
class exampleDaemon extends daemon {
    /**
     * construct example daemon class
     *
     * @param {*} a
     * @param {*} b
     */
    constructor (a, b) {
        // run super
        super (a, b);
    }
}

/**
 * export example daemon class
 *
 * @type {exampleDaemon}
 */
module.exports = exampleDaemon;
