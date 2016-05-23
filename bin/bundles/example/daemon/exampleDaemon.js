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
     */
    constructor (app, server) {
        // run super
        super (app, server);
    }
}

/**
 * export example daemon class
 *
 * @type {exampleDaemon}
 */
module.exports = exampleDaemon;
