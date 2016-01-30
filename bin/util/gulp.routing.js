/**
 * Created by Awesome on 1/30/2016.
 */

import parse   from 'comment-parser';

module.exports = function (chunk, enc, cb) {
    var content = chunk.contents.toString();
    var parsed  = parse(content);
    var lines   = content.split('\n');
    var routes  = {};

    for (var key in parsed) {
        if (parsed[key].tags.length) {
            if (parsed[key]) {
                // null variables
                var fn = false;
                var i  = parsed[key].line;

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

                    // insert route array
                    if (!routes[tag.type]) {
                        routes[tag.type] = {};
                    }

                    // set route function
                    routes[tag.type][tag.name] = {
                        'controller' : './app/bundles' + chunk.path.split('bundles')[1].replace(/\\/g, '/'),
                        'action'     : fn
                    };
                }
            }
        }
    }

    this.push({ routes : routes });
    cb(null, chunk);
};