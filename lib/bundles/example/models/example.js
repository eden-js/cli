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
     * @param attrs
     * @param options
     */
    constructor (attrs, options) {
        // run super
        super (attrs, options);

        // set model location
        this._modelLocation = __filename.replace (global.appRoot, '');
    }
}

/**
 * export user class
 * @type {user}
 */
module.exports = example;
