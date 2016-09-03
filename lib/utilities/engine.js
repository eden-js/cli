// use strict
'use strict';

// require dependencies
var riot        = require ('riot');
var glob        = require ('glob');
var prettyError = require ('pretty-error');
var path        = require ('path');

// require local dependencies
var acl    = require (global.appRoot + '/lib/utilities/acl');
var cache  = require (global.appRoot + '/app/cache/config.json');
var config = require (global.appRoot + '/app/config');

/**
 * create engine class
 */
class engine {
    /**
     * construct riot engine class
     */
    constructor () {
        // require all tags
        var tagFiles = glob.sync (global.appRoot + '/app/cache/views/**/*.{tag,mixin.js}');

        // loop tag files
        for (var i = 0; i < tagFiles.length; i++) {
            // do try/catch
            try {
                // require tag file
                require (tagFiles[i]);
            } catch (e) {
                // log error
                var pe = new prettyError ();
                // log error
                console.log (pe.render (e));
            }
        }

        // bind methods
        this.email  = this.email.bind (this);
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
        options.mountPage = filePath.split (path.sep)[filePath.split (path.sep).length - 1].trim ().replace ('.tag', '') + '-page';

        // delete frontend options
        delete options.cache;
        delete options._locals;
        delete options.settings;

        // set menus
        options.menu = this._menus (options);

        // set layout
        options.layout = (options.layout ? options.layout : 'main') + '-layout';

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

        // start timer
        options.routeEnd = new Date ().getTime ();

        // log timing
        global.logger.log ('debug', 'loaded in ' + (options.routeEnd - options.routeStart) + 'ms', {
            'class' : 'route ' + options.route
        });

        // log render start
        var renderStart = options.routeEnd;

        // do try/catch
        try {
            // render page
            var page = '<!DOCTYPE html>';
            page += '<html>';
            page += '<head>';
            page += '<meta charset="utf-8">';
            page += '<title>' + (options.pagetitle ? options.pagetitle + ' | ' : '') + options.title + '</title>';
            page += '<link rel="stylesheet" href="/public/css/app.min.css' + (config.version ? '?v=' + config.version : '') + '" data-eden="before-head">';
            page += options.head || '';
            page += '</head>';
            page += '<body' + (options.bodyClass ? ' class="' + options.bodyClass + '"' : '') + '>';
            page += riot.render (options.layout, options);

            // delete server
            delete options.server;

            // set before
            var before = options.beforeScript || '';
            var after  = options.afterScript  || '';

            // delete post-render options
            delete options.beforeScript;
            delete options.afterScript;

            page += '<script data-eden="before-script">var edenState = ' + JSON.stringify (options) + ';</script>';
            page += before || '';
            page += '<script type="text/javascript" src="/public/js/app.min.js' + (config.version ? '?v=' + config.version : '') + '" data-eden="before-afterscript"></script>';
            page += after || '';
            page += '</body>';
            page += '</html>';

            // log rendered
            global.logger.log ('debug', 'rendered in ' + (new Date ().getTime () - renderStart) + 'ms', {
                'class' : 'route ' + options.route
            });

            // return render callback
            return callback (null, page);
        } catch (e) {
            // log error
            var pe = new prettyError ();
            // log error
            console.log (pe.render (e));

            // return render callback
            return callback (e);
        }
    }

    /**
     * create email
     *
     * @param  {String} template
     * @param  {Object} options
     *
     * @return {Promise}
     */
    email (template, options) {
        // return new promise
        return new Promise ((resolve, reject) => {
            // get email template
            template = (template.indexOf ('-email') === -1) ? template + '-email' : template;

            // create email template
            var email = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';
            email += '<html xmlns="http://www.w3.org/1999/xhtml">';
            email += '<head>';
            email += '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />';
            email += '<meta name="viewport" content="width=device-width, initial-scale=1" />';
            email += options.style || '';
            email += '</head>';
            email += options.bodyTag || '<body>';
            email += riot.render (template, options).replace ('<' + template + '>', '').replace ('</' + template + '>', '');
            email += '</body>';
            email += '</html>';

            // resolve email html
            resolve (email);
        });
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
        for (var name in cache.menus) {
            // set menus object
            menus[name] = this._subMenu (this._sortMenu (cache.menus[name]), opts);

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
            var child = Object.assign({}, subs[i]);

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
            delete child.name;
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
