
// use strict
'use strict';

// require dependencies
var riot = require ('riot');
var glob = require ('glob');

/**
 * create engine class
 */
class engine {
    constructor () {
        // require all tags
        var tagFiles = glob.sync (global.appRoot + '/cache/view/**/*.tag');

        // loop tag files
        for (var i = 0; i < tagFiles.length; i++) {
            // require tag file
            require (tagFiles[i]);
        }
    }
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
        options.mountPage = filePath.split ('/')[filePath.split ('/').length - 1].trim ().replace ('.tag', '') + '-page';

        // return render callback
        return callback (null, riot.render ((options.layout ? options.layout : 'main') + '-layout', options));
    }
}

/**
 * export engine class
 * @type {engine}
 */
module.exports = engine;
