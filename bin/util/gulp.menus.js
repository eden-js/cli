/**
 * Created by Awesome on 2/20/2016.
 */

'use strict';

var parse = require('comment-parser');

/**
 * export menus
 * @param chunk
 * @param enc
 * @param cb
 */
module.exports = function (chunk, enc, cb) {
    var content = chunk.contents.toString();
    var parsed  = parse(content);
    var lines   = content.split('\n');
    var menus   = {};

    for (var key in parsed) {
        if (parsed[key].tags.length) {
            if (parsed[key]) {
                // null variables
                var fn = false;
                var i  = parsed[key].line;
                var rt = '';

                // loop lines for function
                while (!fn) {
                    i++;
                    if (!lines[i]) {
                        break;
                    }
                    if (lines[i].indexOf('(') > -1 && lines[i].indexOf(')') > -1 && lines[i].indexOf('*') == -1) {
                        fn = lines[i].split('(')[0].trim();
                    }
                }

                // continue if function not found
                if (!fn) {
                    continue;
                }

                // loop tags for route
                for (var tag in parsed[key].tags) {
                    // set tag
                    tag = parsed[key].tags[tag];

                    // ensure tag route
                    if (tag.tag != 'route') {
                        continue;
                    }

                    // set route
                    rt = tag.name;
                }

                // loop tags for menu
                for (var tag in parsed[key].tags) {
                    // set tag
                    tag = parsed[key].tags[tag];

                    // ensure tag route
                    if (tag.tag != 'menu') {
                        continue;
                    }
                    
                    // set options
                    var options = JSON.parse(tag.type);

                    // ensure options
                    if (!options || !options.menu) {
                        continue;
                    }

                    // ensure menu object exists
                    if (!menus[options.menu]) {
                        menus[options.menu] = {};
                    }

                    // create menu object
                    var menu = {
                        'title'    : tag.name,
                        'name'     : options.name ? options.name : tag.name,
                        'priority' : options.priority ? parseInt(options.priority) : 0
                    };

                    // append menu to position
                    if (options.parent) {
                        if (!menus[options.menu][options.parent]) {
                            menus[options.menu][options.parent] = {
                                'title'    : options.parent,
                                'children' : []
                            };
                        }
                        menus[options.menu][options.parent].push(menu);
                    } else {
                        if (menus[menu.name]) {
                            for (var key in menu) {
                                menus[menu.name][key] = menu[key];
                            }
                        } else {
                            menus[menu.name] = menu;
                            menus[menu.name].children = [];
                        }
                    }
                }
            }
        }
    }

    this.push({ menus : menus });
    cb(null, chunk);
};