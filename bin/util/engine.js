
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

        // delete frontend options
        delete options.cache;
        delete options._locals;
        delete options.settings;

        // check if should json
        if (options.isJSON) {
            // delete isJSON
            delete options.isJSON;

            // return callback
            return callback (null, JSON.stringify ({
                'opts' : options
            }));
        }

        // render page
        var page  = '<!DOCTYPE html>';
            page += '<html>';
            page += '<head>';
            page += '<meta charset="utf-8">';
            page += '<title>' + options.title + '</title>';
            page += '<link rel="stylesheet" href="/assets/css/app.min.css">';
            page += '</head>';
            page += '<body>';
            page += riot.render ((options.layout ? options.layout : 'main') + '-layout', options);
            page += '<script>var eden = ' + JSON.stringify (options.eden) + ';</script>';
            page += '<script>var opts = ' + JSON.stringify (options) + ';</script>';
            page += '<script type="text/javascript" src="/assets/js/app.min.js"></script>';
            page += '</body>';
            page += '</html>';

        // return render callback
        return callback (null, page);
    }
}

/**
 * export engine class
 * @type {engine}
 */
module.exports = engine;
