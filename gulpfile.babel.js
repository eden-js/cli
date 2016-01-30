/**
 * Created by Awesome on 1/30/2016.
 */

'use strict';

// import dependancies
import gulp  from 'gulp';
import sass  from 'gulp-sass';
import parse from 'comment-parser';

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