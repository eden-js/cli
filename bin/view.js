/**
 * Created by Awesome on 2/20/2016.
 */

// require dependencies
var hbs  = require('express-hbs');
var path = require('path');

// require local dependencies
var config = require(global.appRoot + '/cache/config.json');
var acl    = require(global.appRoot + '/bin/acl');

/**
 * export exhbs constructor
 */
var expressHBS = hbs.express4({
    // set partials directory
    partialsDir   : global.appRoot + '/cache/view',

    // set layouts directory
    layoutsDir    : global.appRoot + '/cache/view/layout',

    // set default layout
    defaultLayout : global.appRoot + '/cache/view/layout/main.layout.hbs',

    // set hbs extension name
    extname       : '.hbs'
});

// register menu helper
hbs.registerHelper('menu', function(name, className, subClass, options) {
    var menus = config.menus;

    // check for object
    if (Object(className) === className) {
        className = false;
    }
    if (Object(subClass) === subClass) {
        subClass = false;
    }

    // check menu by name exists
    if (menus[name]) {
        // set variables
        var menu = menus[name];
        var rtn  = '<ul class="' + (className ? className : 'nav navbar-nav') + '">';

        menuLoop: // loop menu items
            for (var key in menu) {
                // check if menu can be shown
                if (menu[key].acl) {
                    for (var i = 0; i < menu[key].acl.length; i++) {
                        if (acl.test(menu[key].acl[i], this.user) !== true) {
                            continue menuLoop;
                        }
                    }
                }

                rtn += '<li class="' + (subClass ? subClass : 'nav-item') + '">';

                // check menu has children
                if (menu[key].children.length) {
                    rtn += '<a class="nav-link dropdown-toggle' + (this.route == menu[key].route ? ' active' : '') + '" data-toggle="dropdown" href="' + (menu[key].route ? menu[key].route : '#!') + '" role="button" aria-haspopup="true" aria-expanded="false">' + menu[key].title + '</a>';
                    rtn += '<div class="dropdown-menu">';

                    subLoop: // loop children
                        for (var sub in menu[key].children) {
                            // check if child can be shown
                            if (menu[key].children[sub].acl) {
                                for (var i = 0; i < menu[key].children[sub].acl.length; i++) {
                                    if (acl.test(menu[key].children[sub].acl[i], this.user) !== true) {
                                        continue subLoop;
                                    }
                                }
                            }

                            rtn += '<a class="dropdown-item" href="' + (menu[key].children[sub].route ? menu[key].children[sub].route : '#!') + '">' + menu[key].children[sub].title + '</a>';
                        }

                    rtn += '</div>';
                } else {
                    rtn += '<a class="nav-link' + (this.route == menu[key].route ? ' active' : '') + '" href="' + (menu[key].route ? menu[key].route : '#!') + '">' + menu[key].title + '</a>';
                }
                rtn += '</li>';
            }
        rtn += '</ul>';

        // return menu html
        return rtn;
    }
});

/**
 * export handlebars view
 */
module.exports = expressHBS;