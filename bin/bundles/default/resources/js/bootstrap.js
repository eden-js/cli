/**
 * Created by Awesome on 2/6/2016.
 */

// use strict
'use strict';

// require local dependencies
var riot = require ('riot');
var tags = require ('cache/tags.min.js');

/**
 * build bootstrap class
 */
class bootstrap {
    /**
     * construct bootstrap class
     */
    constructor () {
        // run on document ready
        riot.mount ('*', window.opts);
    }
}

/**
 * export new bootstrap function
 *
 * @return {bootstrap}
 */
module.exports = new bootstrap ();
