/**
 * Created by Awesome on 1/30/2016.
 */

'use strict';

// import dependancies
import gulp    from 'gulp';
import rename  from 'gulp-rename';
import sass    from 'gulp-sass';
import parse   from 'comment-parser';
import through from 'through2';
import fs      from 'fs';

// gulp sass task
gulp.task('sass', function () {
    gulp.src('./sass/**/*.scss')
        .pipe(sass.sync().on('error', sass.logError))
        .pipe(gulp.dest('./css'));
});

// gulp sass watch task
gulp.task('sass:watch', function () {
    gulp.watch('./sass/**/*.scss', ['sass']);
});
// gulp sass watch task
gulp.task('routes:watch', function () {
    gulp.watch('./app/bundles/**/*Controller.js', ['routes']);
});

// gulp route task
gulp.task('routes', function () {
    var allRoutes = {};
    gulp.src('./app/bundles/**/*Controller.js')
        .pipe(through.obj(function (chunk, enc, cb) {
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
                                'controller' : '/app/bundles' + chunk.path.split('bundles')[1].replace(/\\/g, '/'),
                                'action'     : fn
                            };
                        }
                    }
                }
            }

            this.push({ routes : routes });
            cb(null, chunk);
        }))
        .on('data', function (data) {
            console.log(data);
            MergeRecursive(allRoutes, data.routes);
        })
        .on('end', function() {
            fs.writeFile('./cache/routes.json', JSON.stringify(allRoutes), function(err) {
                if(err) {
                    return console.log(err);
                }

                console.log('routes file created');
            });
        });
});

/*
 * Recursively merge properties of two objects
 */
function MergeRecursive(obj1, obj2) {

    for (var p in obj2) {
        try {
            // Property in destination object set; update its value.
            if ( obj2[p].constructor==Object ) {
                obj1[p] = MergeRecursive(obj1[p], obj2[p]);

            } else {
                obj1[p] = obj2[p];

            }

        } catch(e) {
            // Property in destination object not set; create it and set its value.
            obj1[p] = obj2[p];

        }
    }

    return obj1;
}