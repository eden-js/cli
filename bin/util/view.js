/**
 * Created by Awesome on 2/20/2016.
 */

// use strict
'use strict';

// require dependencies
var hbs  = require ('express-hbs');
var path = require ('path');
var co   = require ('co');

// require local dependencies
var config = require (global.appRoot + '/cache/config.json');
var acl    = require (global.appRoot + '/bin/util/acl');

/**
 * construct view
 */
class view {
    /**
     * construct view class
     */
    constructor () {
        // bind variables
        this.engine       = false;
        this.asyncHelpers = [
            '_menu',
            '_acl'
        ];
        this.syncHelpers  = [
            '_json',
            '_eq'
        ];

        // bind methods
        this.build = this.build.bind (this);

        // build
        this.build ();
    }

    /**
     * build engine
     */
    build () {
        // build engine
        this.engine = hbs.express4 ({
            // set partials directory
            partialsDir : global.appRoot + '/cache/view',

            // set layouts directory
            layoutsDir : global.appRoot + '/cache/view/layout',

            // set default layout
            defaultLayout : global.appRoot + '/cache/view/layout/main.layout.hbs',

            // set hbs extension name
            extname : '.hbs'
        });

        // set i for helper loops
        var i = 0;

        // build helpers
        for (i = 0; i < this.asyncHelpers.length; i++) {
            hbs.registerAsyncHelper (this.asyncHelpers[i].replace ('_', ''), this[this.asyncHelpers[i]]);
        }
        for (i = 0; i < this.syncHelpers.length; i++) {
            hbs.registerHelper (this.syncHelpers[i].replace ('_', ''), this[this.syncHelpers[i]]);
        }
    }

    /**
     * tests menu acl
     *
     * @param acl
     * @param user
     * @returns {Promise}
     */
    static testMenuAcl (aclTest, user) {
        return new Promise ((resolve, reject) => {
            co (function * () {
                if (!aclTest) {
                    return resolve (true);
                }

                // test acl
                var test = yield acl.test (aclTest, user);

                // check test
                if (test === true) {
                    // resolve false
                    return resolve (true);
                }

                // resolve false
                return resolve (false);
            });
        });
    }

    /**
     * sorts menu by priority
     *
     * @param menu
     * @returns {Array}
     */
    static sortMenu (menu) {
        // set pre sort array
        var arr = [];

        // loop menu object
        for (var key in menu) {
            arr.push (menu[key]);
        }

        // sort by priority
        arr.sort (function (a, b) {
            return (a.priority || 10) > (b.priority || 10);
        });

        // return array
        return arr;
    }


    /**
     * menu helper
     *
     * @param name
     * @param classes
     * @param cb
     * @private
     */
    _menu (name, classes, cb) {
        // set menus
        var menus  = config.menus;
        var that   = this;
        var remove = [];

        // check for removed menus
        if (that.menu && that.menu.remove && that.menu.remove.length) {
            for (var i = 0; i < that.menu.remove.length; i++) {
                remove.push(that.menu.remove[i].toUpperCase());
            }
        }

        // set default class names
        var className = false;
        var subClass  = false;

        // check for class object
        if (typeof classes === 'function') {
            cb = classes;
        } else if (Object (classes) !== classes) {
            classes   = classes.split (',');
            className = classes[0];
            subClass  = (classes.length > 0 ? classes[1] : false);
        }

        // check menu by name exists
        if (!menus[name]) {
            return cb ('');
        }

        // run coroutine
        co (function * () {
            // set variables
            var menu = view.sortMenu (menus[name]);
            // open list element
            var rtn = '<ul class="' + (className || 'nav navbar-nav') + '">';

            // loop menu items
            for (var i = 0; i < menu.length; i++) {
                // set item
                let item = menu[i];

                // check if menu removed
                if (remove.indexOf(item.name.toUpperCase()) > -1) {
                    continue;
                }

                // check if menu can be shown
                var test = yield view.testMenuAcl (item.acl, that.user);
                if (!test) {
                    continue;
                }

                // create list element
                rtn += '<li class="' + (subClass || 'nav-item') + '">';

                // check menu has children
                if (item.children && item.children.length) {
                    rtn += '<a class="nav-link dropdown-toggle' + (that.route.replace (/^\/|\/$/g, '') == item.route.replace (/^\/|\/$/g, '') ? ' active' : '') + '" data-toggle="dropdown" href="' + (item.route ? item.route : '#!') + '" role="button" aria-haspopup="true" aria-expanded="false">' + item.title + '</a>';
                    rtn += '<div class="dropdown-menu">';

                    // loop through menu children
                    for (var key in item.children) {
                        // set sub menu
                        let sub = item.children[key];

                        // check if menu removed
                        if (remove.indexOf(sub.name.toUpperCase()) > -1) {
                            continue;
                        }

                        // check if acl for child menu
                        test = yield view.testMenuAcl (sub.acl, that.user);
                        if (!test) {
                            continue;
                        }

                        // ad menu link to parent menu
                        rtn += '<a class="dropdown-item" href="' + (sub.route ? sub.route : '#!') + '">' + sub.title + '</a>';
                    }

                    // close menu div
                    rtn += '</div>';
                } else {
                    // add single link to menu
                    rtn += '<a class="nav-link' + (that.route.replace (/^\/|\/$/g, '') == item.route.replace (/^\/|\/$/g, '') ? ' active' : '') + '" href="' + (item.route ? item.route : '#!') + '">' + item.title + '</a>';
                }

                // close div
                rtn += '</li>';
            }

            // close list
            rtn += '</ul>';

            // return menu html
            cb (rtn);
        });
    }

    /**
     * acl helper
     *
     * @param test acl test
     * @private
     */
    _acl(test, block, cb) {
        // set that
        var that = this;

        // run coroutine
        co(function * () {
            // test acl
            var test = yield acl.test (test, that.user);

            // check if acl true
            if (test !== true) {
                cb(block(this));
            } else {
                cb(block.inverse(this));
            }
        });
    }

    /**
     * json helper
     *
     * @param obj
     * @private
     */
    _json(obj) {
        return JSON.stringify(obj);
    }

    /**
     * check object equals another
     *
     * @param obja
     * @param objb
     * @param assert
     * @returns {*}
     * @private
     */
    _eq (obja, objb, assert) {
        if (Object(assert) === assert) {
            assert = false;
        }
        if (obja === objb) {
            return assert || 'true';
        }
        return '';
    }
}

/**
 * export handlebars view
 */
module.exports = view;
