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
    constructor (a, b) {
        // set variables
        this.app    = a;
        this.server = b;
    }
}

/**
 * export daemon class
 *
 * @type {daemon}
 */
module.exports = daemon;
