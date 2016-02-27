/**
 * Created by Alex.Taylor on 26/02/2016.
 */

// use strict
'use strict';

// require local dependencies
var daemon = require (global.appRoot + '/bin/bundles/core/daemon');

/**
 * build default dameon class
 */
class defaultDaemon extends daemon {
    /**
     * construct default daemon class
     */
    constructor (props) {
        // run super
        super (props);

        // bind methods
        this._log ('defaultDaemon running');
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
 * export default daemon class
 *
 * @type {defaultDaemon}
 */
module.exports = defaultDaemon;