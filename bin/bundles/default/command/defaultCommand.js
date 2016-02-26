/**
 * Created by Alex.Taylor on 26/02/2016.
 */

// use strict
'use strict';

// require local dependencies
var commander = require(global.appRoot + '/bin/bundles/core/commander');

/**
 * build default commander class
 */
class defaultCommander extends commander {
    /**
     * construct default commander class
     *
     * @param props
     */
    constructor(props) {
        // construct parent
        super(props);

        // bind methods
        this.defaultAction = this.defaultAction.bind(this);
    }

    /**
     * BHP Client get action
     *
     * @param name
     * @command default
     */
    defaultAction(name) {
        console.log('ran default command');
    }
}

/**
 * export default commander
 *
 * @type {defaultCommander}
 */
module.exports = defaultCommander;