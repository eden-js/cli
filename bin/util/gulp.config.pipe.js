/**
 * Created by Awesome on 1/30/2016.
 */

// use strict
'use strict';

// require dependencies
var os       = require ('os');
var parse    = require ('comment-parser');
var safeEval = require ('safe-eval');

/**
 * build config pipe
 */
class configPipe {
    /**
     * construct config pipe
     */
    constructor() {
        // bind methods
        this.pipe   = this.pipe.bind (this);
        this.config = this.config.bind (this);

        // bind tag methods
        this._fn       = this._fn.bind (this);
        this._acl      = this._acl.bind (this);
        this._name     = this._name.bind (this);
        this._class    = this._class.bind (this);
        this._menus    = this._menus.bind (this);
        this._routes   = this._routes.bind (this);
        this._mounts   = this._mounts.bind (this);
        this._parent   = this._parent.bind (this);
        this._sockets  = this._sockets.bind (this);
        this._priority = this._priority.bind (this);

        // bind loop methods
        this._loopRoutes = this._loopRoutes.bind (this);
        this._loopMenus  = this._loopMenus.bind (this);

        // bind private methods
        this._merge      = this._merge.bind (this);
        this._parseRoute = this._parseRoute.bind (this);
    }

    /**
     * pipe function
     *
     * @param chunk
     */
    pipe (chunk) {
        var that     = this;
        let content  = chunk.contents.toString ();
        let parsed   = parse (content);
        let lines    = content.split (os.EOL);

        // complete pipe loop
        return new Promise ((resolve, reject) => {
            resolve (that.config (chunk, parsed, lines));
        });
    }

    /**
     * routes
     *
     * @param chunk
     * @param parsed
     * @param lines
     * @returns {{}}
     */
    config (chunk, parsed, lines) {
        var that      = this;
        var dPriority = 10;
        var priority  = dPriority;
        var acl       = false;
        var mounts    = [];
        var rtn       = {
            'sockets' : {},
            'routes'  : {},
            'menus'   : {},
            'acl'     : {}
        };

        // loop parsed
        for (var i = 0; i < parsed.length; i++) {
            // set scoped variables
            let obj  = parsed[i];
            let tags = parsed[i].tags;

            // check for class
            var isClass = that._class (obj.line, lines);
            if (isClass) {
                acl      = that._acl (tags);
                mounts   = that._mounts (tags);
                priority = that._priority (tags, dPriority);
            }

            // check for route
            var isFn = that._fn (obj.line, lines);

            // if is function
            if (isFn) {
                // get function level priority
                priority   = that._priority (tags, priority);
                var routes = that._routes (tags);

                // check if routes length
                if (routes) {
                    // force mount
                    if (!mounts.length) {
                        mounts = ['/'];
                    }

                    // loop routes
                    var routeLoop = that._loopRoutes (routes, mounts, priority, acl, chunk, isFn);
                    rtn.routes    = that._merge (rtn.routes, routeLoop.routes);
                    rtn.acl       = that._merge (rtn.acl, routeLoop.acl);

                    // get array of menus in tags
                    var isMenu = that._menus (tags);

                    // chekc if menus exist
                    if (isMenu) {
                        rtn.menus = that._merge (rtn.menus, that._loopMenus (isMenu, mounts, priority, routes, rtn.acl));
                    }
                }

                // get array of sockets in tags
                var isSocket = that._sockets (tags);

                // chekc if menus exist
                if (isSocket) {
                    rtn.sockets = that._merge (rtn.sockets, that._loopSockets (isSocket, priority, acl, chunk, isFn));
                }
            }
        }

        // return rtn
        return rtn;
    }

    /**
     * checks if comment attached to function
     *
     * @param line
     * @param lines
     * @returns {boolean}
     * @private
     */
    _fn (line, lines) {
        // set variables
        var isFn = false;

        // loop check if class
        while (!isFn) {
            // add to line
            line++;

            // check next line exists
            if (!lines[line]) {
                break;
            }

            // check if function
            if (lines[line].indexOf ('(') > -1 && lines[line].indexOf (')') > -1) {
                isFn = lines[line].split ('(')[0].trim ();
                if (isFn.indexOf ('*') > -1) {
                    isFn = isFn.split ('*')[1].trim ();
                }
            } else if (lines[line].indexOf ('*') === -1) {
                break;
            }
        }

        // return class
        return isFn;
    }

    /**
     * checks if comment attached to class
     *
     * @param line
     * @param lines
     * @returns {boolean}
     * @private
     */
    _class (line, lines) {
        // set variables
        var isClass = false;

        // loop check if class
        while (!isClass) {
            // add to line
            line++;

            // check next line exists
            if (!lines[line]) {
                break;
            }

            // check if class
            if (lines[line].indexOf('class') > -1 && lines[line].indexOf('*') == -1) {
                isClass = lines[line].split('class')[1].split('extends')[0].trim();
            } else if (lines[line].indexOf('*') === -1) {
                break;
            }
        }

        // return class
        return isClass;
    }

    /**
     * checks for menus
     *
     * @param tags
     * @returns {*}
     * @private
     */
    _menus (tags) {
        // set mounts
        var menus = [];

        // loop tags for mount
        for (var i = 0; i < tags.length; i++) {
            // let tag object
            let tag = tags[i];

            // check if mount
            if (tag.tag == 'menu') {
                var acl = this._acl (tags);
                menus.push({
                    'title'    : tag.name,
                    'name'     : this._name (tags, tag.name, i),
                    'menu'     : tag.type,
                    'parent'   : this._parent (tags, false, i),
                    'priority' : this._priority (tags, 10),
                    'acl'      : acl || false
                });
            }
        }

        // return false
        return menus.length ? menus : false;
    }

    /**
     * checks for sockets
     *
     * @param tags
     * @returns {*}
     * @private
     */
    _sockets(tags) {
        // set mounts
        var sockets = [];

        // loop tags for mount
        for (var i = 0; i < tags.length; i++) {
            // let tag object
            let tag = tags[i];

            // check if mount
            if (tag.tag == 'socket') {
                var acl = this._acl(tags);
                sockets.push({
                    'type'     : tag.type,
                    'priority' : this._priority(tags, 10),
                    'acl'      : (acl ? acl : false)
                });
            }
        }

        // return false
        return sockets.length ? sockets : false;
    }

    /**
     * returns acl array for tag
     *
     * @param tags
     * @returns {*}
     * @private
     */
    _acl (tags) {
        // loop tags for priority
        for (var i = 0; i < tags.length; i++) {
            // let tag object
            let tag = tags[i];

            // check if priority
            if (tag.tag == 'acl') {
                return safeEval ('({' + tag.type + '})');
            }
        }

        // return default priority
        return false;
    }

    /**
     * check for mounts
     *
     * @param tags
     * @returns {*}
     * @private
     */
    _mounts (tags) {
        // set mounts
        var mounts = [];

        // loop tags for mount
        for (var i = 0; i < tags.length; i++) {
            // let tag object
            let tag = tags[i];

            // check if mount
            if (tag.tag == 'mount') {
                mounts.push (tag.name);
            }
        }

        // return false
        return mounts.length ? mounts : false;
    }

    /**
     * checks for name
     *
     * @param tags
     * @param def
     * @param after
     * @returns {*}
     * @private
     */
    _name (tags, def, after) {
        // loop tags for priority
        for (var i = after; i < tags.length; i++) {
            // let tag object
            let tag = tags[i];

            // check if priority
            if (tag.tag == 'name') {
                return tag.name;
            }
        }

        // return default priority
        return def;
    }

    /**
     * checks for parent
     *
     * @param tags
     * @param def
     * @param after
     * @returns {*}
     * @private
     */
    _parent (tags, def, after) {
        // loop tags for priority
        for (var i = after; i < tags.length; i++) {
            // let tag object
            let tag = tags[i];

            // check if priority
            if (tag.tag == 'parent') {
                return tag.name;
            }
        }

        // return default priority
        return def;
    }

    /**
     * checks for priority
     *
     * @param tags
     * @param def
     * @returns {*}
     * @private
     */
    _priority (tags, def) {
        // loop tags for priority
        for (var i = 0; i < tags.length; i++) {
            // let tag object
            let tag = tags[i];

            // check if priority
            if (tag.tag == 'priority') {
                return parseInt (tag.name);
            }
        }

        // return default priority
        return def;
    }

    /**
     * checks for routes
     *
     * @param tags
     * @returns {*}
     * @private
     */
    _routes (tags) {
        // set mounts
        var routes = [];

        // loop tags for mount
        for (var i = 0; i < tags.length; i++) {
            // let tag object
            let tag = tags[i];

            // check if route
            if (tag.tag == 'route') {
                routes.push({
                    'type'  : tag.type,
                    'route' : tag.name,
                    'acl'   : this._acl (tags, i)
                });
            }
        }

        // return false
        return routes.length ? routes : false;
    }

    /**
    * loop routes for menu config object
    *
    * @param routes
    * @param mounts
    * @param priority
    * @param chunk
    * @param fn
    *
    * @returns {*}
    * @private
     */
    _loopRoutes (routes, mounts, priority, scopeAcl, chunk, fn) {
        // create return variable
        var rtn = {};
        var acl = {};

        // loop routes
        for (var i = 0; i < routes.length; i++) {
            /// loop mount points
            for (var y = 0; y < mounts.length; y++) {
                // ensure type object exists
                if (!rtn[priority]) {
                    rtn[priority] = {};
                }

                // ensure priority object exists
                if (!rtn[priority][routes[i].type]) {
                    rtn[priority][routes[i].type] = {};
                }

                // set acl route
                var rt = this._parseRoute (mounts[y] + routes[i].route);

                // ensure flattened acl
                if (!acl[rt]) {
                    acl[rt] = [];
                }
                // add acl to acl array
                if (routes[i].acl) {
                    acl[rt].push (routes[i].acl);
                }
                // check for scope acl
                if (scopeAcl) {
                    acl[rt].push (scopeAcl);
                }

                // remove acl if required
                if (!acl[rt].length) {
                    delete acl[rt];
                }

                // add route to array
                rtn[priority][(routes[i].type ? routes[i].type : 'get')][rt] = {
                    'controller' : '/' + (chunk.path.indexOf ('/app') > -1 ? 'app' : 'bin') + '/bundles' + chunk.path.split ('bundles')[1].replace (/\\/g, '/'),
                    'action'     : fn
                };
            }
        }

        // return object
        return {
            'routes' : rtn,
            'acl'    : acl
        };
    }

    /**
    * loop menus for menu config object
    *
    * @param menus
    * @param mounts
    * @param priority
    * @param routes
    * @param acl
    *
    * @returns {*}
    * @private
     */
    _loopMenus (menus, mounts, priority, routes, acl) {
        var rtn = {};

        // loop menus
        for (var m = 0; m < menus.length; m++) {
            // only use first route
            menus[m].route    = this._parseRoute (mounts[0] + routes[0].route);
            menus[m].priority = menus[m].priority || priority;

            // set acl
            var menuAcl = acl[menus[m].route] || false;
            if (menuAcl && menuAcl.length) {
                for (var a = 0; a < menuAcl.length; a++) {
                    if (! menus[m].acl || ! Array.isArray (menus[m].acl.test)) {
                      menus[m].acl = menuAcl[a];
                    } else if (Array.isArray (menus[m].acl.test)) {
                      menus[m].acl.test.concat (menuAcl[a].test, menus[m].acl.test);
                    }
                }
            }

            // set menu object
            if (!rtn[menus[m].menu]) {
                rtn[menus[m].menu] = {};
            }

            // set menu
            if (menus[m].parent) {
                if (!rtn[menus[m].menu][menus[m].parent]) {
                    rtn[menus[m].menu][menus[m].parent] = {
                        'title'    : menus[m].parent,
                        'children' : []
                    };
                }
                rtn[menus[m].menu][menus[m].parent].children.push (menus[m]);
            } else {
                if (rtn[menus[m].menu][menus[m].name]) {
                    for (var key in menus[m]) {
                        rtn[menus[m].menu][menus[m].name][key] = menus[m][key];
                    }
                } else {
                    rtn[menus[m].menu][menus[m].name] = menus[m];
                    rtn[menus[m].menu][menus[m].name].children = [];
                }
            }
        }

        // return object
        return rtn;
    }

    /**
    * loop sockets for socket config object
    *
    * @param sockets
    * @param priority
    * @param acl
    * @param chunk
    * @param fn
    *
    * @returns {*}
    * @private
     */
    _loopSockets (sockets, priority, acl, chunk, fn) {
        var rtn = {};

        // loop menu
        for (var s = 0; s < sockets.length; s++) {
            sockets[s].priority = sockets[s].priority ? sockets[s].priority : priority;

            // check for scoped acl
            if (acl) {
                if (!sockets[s].acl || !Array.isArray(sockets[s].acl.test)) {
                  sockets[s].acl = acl;
                } else if (Array.isArray(acl.test)) {
                  sockets[s].acl.test.concat(acl.test, sockets[s].acl.test);
                }
            }

            sockets[s].controller = '/' + (chunk.path.indexOf ('/app') > -1 ? 'app' : 'bin') + '/bundles' + chunk.path.split ('bundles')[1].replace (/\\/g, '/');
            sockets[s].socket     = fn;

            // set in return object
            rtn[sockets[s].type] = sockets[s];
        }

        // return sockets
        return rtn;
    }

    /**
    * Returns parsed route string
    *
    * @param route
    *
    * @returns {String}
    * @private
     */
    _parseRoute (route) {
        return '/' + route.split ('//').join ('/').replace (/^\/|\/$/g, '');
    }

    /**
     * merges two objects
     *
     * @param obj1
     * @param obj2
     * @returns {*}
     * @private
     */
    _merge (obj1, obj2) {
        for (var p in obj2) {
            try {
                // Property in destination object set; update its value.
                if (obj2[p].constructor == Object) {
                    obj1[p] = this._merge (obj1[p], obj2[p]);
                } else {
                    obj1[p] = obj2[p];
                }
            } catch (e) {
                // Property in destination object not set; create it and set its value.
                obj1[p] = obj2[p];
            }
        }

        return obj1;
    }
}

/**
 * export config pipe
 *
 * @type {configPipe}
 */
module.exports = new configPipe();
