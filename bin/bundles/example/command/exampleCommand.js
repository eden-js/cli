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
class exampleCommand extends commander {
    /**
     * construct default commander class
     *
     * @param props
     */
    constructor(props) {
        // construct parent
        super(props);

        // bind methods
        this.exampleAction = this.exampleAction.bind(this);
    }

    /**
     * BHP Client get action
     *
     * @param name
     * @command example
     */
    exampleAction(name) {
        console.log('ran default command');
    }
}

/**
 * export example command
 *
 * @type {exampleCommand}
 */
module.exports = exampleCommand;