/**
 * Created by Awesome on 1/30/2016.
 */

'use strict';

// import dependancies
import gulp    from 'gulp';
import rename  from 'gulp-rename';
import sass    from 'gulp-sass';
import through from 'through2';
import routing from './bin/util/gulp.routing';
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
        .pipe(through.obj(routing))
        .on('data', function (data) {
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