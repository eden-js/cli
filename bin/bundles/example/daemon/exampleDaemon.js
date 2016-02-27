/**
 * Created by Alex.Taylor on 26/02/2016.
 */

// use strict
'use strict';

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
        this._log ('exampleDaemon running');
    }

    /**
     * logs to console
     *
     * @param text
     * @private
     */
    _log (text) {
        console.log ('[daemon]: ' + text);
    }
}

/**
 * export example daemon class
 *
 * @type {exampleDaemon}
 */
module.exports = exampleDaemon;