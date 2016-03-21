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
     * @param  {express4} app    express app
     * @param  {Server}   server express server
     */
    constructor (app, server) {
        // set variables
        this.app    = app;
        this.server = server;
    }
}

/**
 * export daemon class
 *
 * @type {daemon}
 */
module.exports = daemon;
