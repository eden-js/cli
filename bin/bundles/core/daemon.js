/**
 * Created by Alex.Taylor on 26/02/2016.
 */

// use strict
'use strict';

/**
 * construct daemon class
 */
class daemon {
    /**
     * construct daemon
     *
     * @param  {express4} a  express app
     * @param  {Server}   b  express server
     */
    constructor (eden) {
        // set variables
        this.app    = eden.app;
        this.logger = eden.logger;
        // this.server = eden.;
    }
}

/**
 * export daemon class
 *
 * @type {daemon}
 */
module.exports = daemon;
