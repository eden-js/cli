/**
 * Created by Awesome on 2/6/2016.
 */

// use strict
'use strict';

// import local dependencies
var model = require ('model');

/**
 * create user class
 */
class example extends model {
    /**
     * construct example model
     *
     * @param a
     * @param b
     */
    constructor (a, b) {
        // run super
        super (a, b);

        // set model location
        this._modelLocation = __filename.replace (global.appRoot, '');
    }
}

/**
 * export user class
 * @type {user}
 */
module.exports = example;
