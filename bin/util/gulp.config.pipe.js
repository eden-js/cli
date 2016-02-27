/**
 * Created by Awesome on 1/30/2016.
 */

// use strict
'use strict';

// require dependencies
var parse = require('comment-parser');
var os    = require('os');

/**
 * build config pipe
 */
class configPipe {
    /**
     * construct config pipe
     */
    constructor() {
        // bind methods
        this.pipe = this.pipe.bind(this);
    }

    /**
     * pipe function
     *
     * @param chunk
     */
    pipe(chunk) {
        var that     = this;
        let content  = chunk.contents.toString();
        let parsed   = parse(content);
        let lines    = content.split(os.EOL);

        // complete pipe loop
        return new Promise((resolve, reject) => {
            resolve(that.config(chunk, parsed, lines));
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
    config(chunk, parsed, lines) {
        var that      = this;
        var dPriority = 10;
        var priority  = dPriority;
        var mounts    = [];
        var rtn       = {
            'routes' : {},
            'menus'  : {}
        };

        // loop parsed
        for (var i = 0; i < parsed.length; i++) {
            // set scoped variables
            priority = dPriority;
            let obj  = parsed[i];
            let tags = parsed[i].tags;

            // check for class
            var isClass = that._class(obj.line, lines);
            if (isClass) {
                mounts   = that._mounts(tags);
                priority = that._priority(tags, dPriority);
            }

            // check for route
            var isFn = that._fn(obj.line, lines);
            if (isFn) {
                priority   = that._priority(tags, priority);
                var routes = that._routes(tags);

                // check if routes length
                if (routes) {
                    // force mount
                    if (!mounts.length) {
                        mounts = ['/'];
                    }

                    // loop routes
                    for (var x = 0; x < routes.length; x++) {
                        /// loop mount points
                        for (var y = 0; y < mounts.length; y++) {
                            // ensure type object exists
                            if (!rtn['routes'][priority]) {
                                rtn['routes'][priority] = {};
                            }
                            // ensure priority object exists
                            if (!rtn['routes'][priority][routes[x].type]) {
                                rtn['routes'][priority][routes[x].type] = {};
                            }
                            // add route to array
                            rtn['routes'][priority][routes[x].type][(mounts[y] + routes[x].route).split('//').join('/')] = {
                                'controller' : '/' + (chunk.path.indexOf('/app') > -1 ? 'app' : 'bin') + '/bundles' + chunk.path.split('bundles')[1].replace(/\\/g, '/'),
                                'action'     : isFn
                            }
                        }
                    }

                    var isMenu = that._menus(tags);
                    if (isMenu) {
                        if (!mounts.length) {
                            mounts = ['/'];
                        }

                        for (var m = 0; m < isMenu.length; m++) {
                            // only use first route
                            isMenu[m].route    = (mounts[0] + routes[0].route).split('//').join('/');
                            isMenu[m].priority = isMenu[m].priority ? isMenu[m].priority : priority;

                            // set menu object
                            if (!rtn['menus'][isMenu[m].menu]) {
                                rtn['menus'][isMenu[m].menu] = {};
                            }

                            // set menu
                            if (isMenu[m].parent) {
                                if (!rtn['menus'][isMenu[m].menu][isMenu[m].parent]) {
                                    rtn['menus'][isMenu[m].menu][isMenu[m].parent] = {
                                        'title'    : isMenu[m].parent,
                                        'children' : []
                                    };
                                }
                                rtn['menus'][isMenu[m].menu][isMenu[m].parent].children.push(isMenu[m]);
                            } else {
                                if (rtn['menus'][isMenu[m].menu][isMenu[m].name]) {
                                    for (var key in isMenu[m]) {
                                        rtn['menus'][isMenu[m].menu][isMenu[m].name][key] = isMenu[m][key];
                                    }
                                } else {
                                    rtn['menus'][isMenu[m].menu][isMenu[m].name] = isMenu[m];
                                    rtn['menus'][isMenu[m].menu][isMenu[m].name].children = [];
                                }
                            }
                        }
                    }
                }
            }
        }

        // return rtn
        return rtn;
    }

    /**
     * checks if comment attached to class
     *
     * @param line
     * @param lines
     * @returns {boolean}
     * @private
     */
    _class(line, lines) {
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
     * checks if comment attached to function
     *
     * @param line
     * @param lines
     * @returns {boolean}
     * @private
     */
    _fn(line, lines) {
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
            if (lines[line].indexOf('(') > -1 && lines[line].indexOf(')') > -1 && lines[line].indexOf('*') == -1) {
                isFn = lines[line].split('(')[0].trim();
            } else if (lines[line].indexOf('*') === -1) {
                break;
            }
        }

        // return class
        return isFn;
    }

    /**
     * checks for menus
     *
     * @param tags
     * @returns {*}
     * @private
     */
    _menus(tags) {
        // set mounts
        var menus = [];

        // loop tags for mount
        for (var i = 0; i < tags.length; i++) {
            // let tag object
            let tag = tags[i];

            // check if mount
            if (tag.tag == 'menu') {
                var menu = JSON.parse(tag.type);
                if (menu) {
                    menus.push({
                        'title'    : tag.name,
                        'menu'     : menu.menu,
                        'name'     : menu.name ? menu.name : tag.name,
                        'parent'   : menu.parent ? menu.parent : false,
                        'priority' : menu.priority ? menu.priority : false
                    });
                }
            }
        }

        // return false
        return menus.length ? menus : false;
    }

    /**
     * check for mounts
     *
     * @param tags
     * @returns {*}
     * @private
     */
    _mounts(tags) {
        // set mounts
        var mounts = [];

        // loop tags for mount
        for (var i = 0; i < tags.length; i++) {
            // let tag object
            let tag = tags[i];

            // check if mount
            if (tag.tag == 'mount') {
                mounts.push(tag.name);
            }
        }

        // return false
        return mounts.length ? mounts : false;
    }

    /**
     * checks for priority
     *
     * @param tags
     * @param def
     * @returns {*}
     * @private
     */
    _priority(tags, def) {
        // loop tags for priority
        for (var i = 0; i < tags.length; i++) {
            // let tag object
            let tag = tags[i];

            // check if priority
            if (tag.tag == 'priority') {
                return parseInt(tag.name);
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
    _routes(tags) {
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
                    'route' : tag.name
                });
            }
        }

        // return false
        return routes.length ? routes : false;
    }
}

/**
 * export config pipe
 *
 * @type {configPipe}
 */
module.exports = new configPipe();