// use strict
'use strict';

// require dependencies
var acl  = require ('acl-util');
var riot = require ('riot');
var glob = require ('glob');

// require local dependencies
var config = require (global.appRoot + '/cache/config.json');

/**
 * create engine class
 */
class engine {
    /**
     * construct riot engine class
     */
    constructor () {
        // require all tags
        var tagFiles = glob.sync (global.appRoot + '/cache/view/**/*.{tag,mixin.js}');

        // loop tag files
        for (var i = 0; i < tagFiles.length; i++) {
            // require tag file
            require (tagFiles[i]);
        }

        // bind methods
        this.render = this.render.bind (this);

        // bind private methods
        this._menus    = this._menus.bind (this);
        this._subMenu  = this._subMenu.bind (this);
        this._sortMenu = this._sortMenu.bind (this);
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

        // set menus
        options.menu = this._menus (options);

        // check if should json
        if (options.isJSON) {
            // delete isJSON
            delete options.isJSON;

            // return callback
            return callback (null, JSON.stringify({
                'opts': options
            }));
        }

        // set server option
        options.server = true;

        console.time ('render');

        // render page
        var page = '<!DOCTYPE html>';
        page += '<html>';
        page += '<head>';
        page += '<meta charset="utf-8">';
        page += '<title>' + options.title + '</title>';
        page += '<link rel="stylesheet" href="/assets/css/app.min.css">';
        page += options.head || '';
        page += '</head>';
        page += '<body>';
        page += riot.render ((options.layout ? options.layout : 'main') + '-layout', options);

        // delete server
        delete options.server;

        page += '<script>var edenState = ' + JSON.stringify (options) + ';</script>';
        page += '<script type="text/javascript" src="/assets/js/app.min.js"></script>';
        page += options.body || '';
        page += '</body>';
        page += '</html>';

        console.timeEnd ('render');

        // return render callback
        return callback (null, page);
    }

    /**
     * creates menus object
     *
     * @param  {Object} options
     *
     * @private
     * @return {Object}
     */
    _menus (opts) {
        // create menus object
        var menus = {};

        // loop menus
        for (var name in config.menus) {
            // set menus object
            menus[name] = this._subMenu (this._sortMenu (config.menus[name]), opts);

            // check menu length
            if (!menus[name].length) {
                // remove menu
                delete menus[name];
            }
        }

        // return menus object
        return menus;
    }

    /**
     * loop menu items
     *
     * @param  {Array}  subs
     * @param  {Object} options
     *
     * @private
     * @return {Array}
     */
    _subMenu (subs, opts) {
        // set remove
        var menu = [];
        var route = (opts.route || '').replace (/^\/|\/$/g, '');
        var remove = opts.menu && opts.menu.remove ? opts.menu.remove : [];

        // loop menu children
        for (var i = 0; i < subs.length; i++) {
            // let child
            var child = subs[i];

            // check child exists
            if (!child) {
                continue;
            }

            // check if should remove
            if (remove.indexOf (child.name.toUpperCase ()) > -1) {
                continue;
            }

            // check for item children
            if (child.children && child.children.length) {
                // set menu children
                child.children = this._subMenu (this._sortMenu (child.children), opts);
            }

            // check children length
            if (child.children && !child.children.length) {
                // delete children
                delete child.children;
            }

            // check if acl
            if (child.acl && acl.acl (opts.acl.length ? opts.acl : false, child.acl, opts.user) !== true) {
                continue;
            }

            // check if active
            child.active = child.route ? (route == child.route.replace (/^\/|\/$/g, '')) : false;

            // remove active if false
            if (!child.active) delete child.active;

            // delete redundant fields
            delete child.acl;
            delete child.menu;
            delete child.parent;
            delete child.priority;

            // add to array
            menu.push (child);
        }

        // return menu
        return menu;
    }

    /**
     * sorts menu by priority
     *
     * @param {Object} menu
     *
     * @private
     * @returns {Array}
     */
    _sortMenu (menu) {
        // set pre sort array
        var arr = [];

        // loop menu object
        for (var key in menu) {
            arr.push (menu[key]);
        }

        // sort by priority
        arr.sort (function (a, b) {
            if ((a.priority ? a.priority : 10) > (b.priority ? b.priority : 10)) {
                return 1;
            } else if ((a.priority ? a.priority : 10) < (b.priority ? b.priority : 10)) {
                return -1;
            } else {
                return 0;
            }
        });

        // return array
        return arr;
    }
}

/**
 * export engine class
 * @type {engine}
 */
module.exports = engine;
