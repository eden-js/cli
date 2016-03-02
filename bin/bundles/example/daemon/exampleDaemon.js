/**
 * Created by Alex.Taylor on 26/02/2016.
 */

// use strict
'use strict';

// set app root
global.appRoot = '../../../..';

// require local dependencies
var daemon = require (global.appRoot + '/bin/bundles/core/daemon');

/**
 * build example dameon class
 */
class exampleDaemon extends daemon {
    /**
     * construct example daemon class
     */
    constructor (props) {
        // run super
        super (props);

        // bind methods
        process.send ('exampleDaemon running');
    }
}

/**
 * export example daemon class
 *
 * @type {exampleDaemon}
 */
module.exports = new exampleDaemon();