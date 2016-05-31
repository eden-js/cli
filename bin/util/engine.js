
// use strict
'use strict';

// require dependencies
var riot = require ('riot');

/**
 * create engine class
 */
class engine {
    /**
     * render riot tag locally
     *
     * @param  {String}   filePath
     * @param  {*}        options
     * @param  {Function} callback
     *
     * @return {*}
     */
    render (filePath, options, callback) {
        // require riot tag
        var tpl = require (filePath);

        // return render callback
        return callback (null, riot.render (tpl, options));
    }
}

/**
 * export engine class
 * @type {engine}
 */
module.exports = engine;
