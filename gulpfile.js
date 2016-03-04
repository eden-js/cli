/**
 * Created by Awesome on 1/30/2016.
 */

    // use strict
'use strict';

// require dependencies
var fs         = require ('fs');
var os         = require ('os');
var glob       = require ('glob');
var path       = require ('path');
var through    = require ('through2');
var browserify = require ('browserify');
var babelify   = require ('babelify');
var source     = require ('vinyl-source-stream');

// require gulp dependencies
var rename     = require ('gulp-rename');
var sass       = require ('gulp-sass');
var sourcemaps = require ('gulp-sourcemaps');
var concat     = require ('gulp-concat');
var riot       = require ('gulp-riot');
var insert     = require ('gulp-insert');
var streamify  = require ('gulp-streamify');
var uglify     = require ('gulp-uglify');
var nodemon    = require ('gulp-nodemon');
var chmod      = require ('gulp-chmod');

// import local dependencies
var config     = require ('./config');
var configPipe = require ('./bin/util/gulp.config.pipe');

/**
 * build gulp builder class
 */
class gulpBuilder {
    /**
     * construct gulp builder class
     */
    constructor () {
        // wait time
        this.wait = (config.gulpDelay ? parseInt (config.gulpDelay) : 500);

        // bind variables
        this.gulp = require ('gulp');

        // bind methods
        this._tasks = {
            'sass'   : [
                './bin/bundles/*/resources/scss/**/*.scss',
                './app/bundles/*/resources/scss/**/*.scss'
            ],
            'daemon' : [
                './bin/bundles/*/daemon/**/*Daemon.js',
                './app/bundles/*/daemon/**/*Daemon.js'
            ],
            'config' : [
                './bin/bundles/*/controller/**/*Controller.js',
                './app/bundles/*/controller/**/*Controller.js'
            ],
            'view'   : [
                './bin/bundles/*/view/**/*.hbs',
                './app/bundles/*/view/**/*.hbs'
            ],
            'tag'    : [
                './bin/bundles/*/view/tag/**/*.tag',
                './app/bundles/*/view/tag/**/*.tag'
            ],
            'js'     : [
                './bin/bundles/*/resources/js/**/*.js',
                './app/bundles/*/resources/js/**/*.js'
            ]
        };

        // set keys array
        var that  = this;
        var keys  = Object.keys (this._tasks);
        var watch = [];

        // bind and add gulp task methods
        for (var i = 0; i < keys.length; i ++) {
            // bind method
            this[keys[i]] = this[keys[i]].bind (this);
            // setup task
            this.gulp.task (keys[i], this[keys[i]]);
            // setup watch task
            this.gulp.task (keys[i] + ':watch', () => {
                that.gulp.watch (that._tasks[keys[i]], [keys[i]]);
            });
            // add watch task to array
            watch.push (keys[i] + ':watch');
        }

        // add install task
        this.gulp.task ('install', keys);
        // add watch task
        this.gulp.task ('watch', watch);
        // add dev server task
        this.gulp.task ('dev', () => {
            // run nodemon task
            nodemon ({
                'script' : './app.js',
                'ext'    : 'js json',
                'delay'  : this.wait,
                'watch'  : [
                    'cache/'
                ],
                'env'    : {
                    'NODE_ENV' : 'development'
                }
            });

            // loop for watch
            for (var i = 0; i < keys.length; i ++) {
                that.gulp.watch (that._tasks[keys[i]], [keys[i]]);
            }
        });
        // add default task
        this.gulp.task ('default', [
            'install',
            'dev'
        ]);
    }

    /**
     * sass task
     */
    sass () {
        // set variables
        var that = this;
        var all  = '';

        // grab gulp source for sass
        // do within setTimeout to remove empty files
        setTimeout (() => {
            this.gulp.src ([
                './bin/bundles/*/resources/scss/variables.scss',
                './app/bundles/*/resources/scss/variables.scss',
                (config.bootstrap ? config.bootstrap : 'node_modules/bootstrap/scss/bootstrap-flex.scss'),
                './bin/bundles/*/resources/scss/bootstrap.scss',
                './app/bundles/*/resources/scss/bootstrap.scss'
            ])
                .pipe (through.obj (function (chunk, enc, cb) {
                    // run through callback
                    this.push ({
                        'all' : '@import ".' + chunk.path.replace (__dirname, '').split (path.delimiter).join ('/') + '";' + os.EOL
                    });

                    // run callback
                    cb (null, chunk);
                }))
                .on ('data', (data) => {
                    if (data.all) {
                        all += data.all;
                    }
                })
                .on ('end', function () {
                    // write temp sass file
                    fs.writeFile ('./tmp.scss', all, (err) => {
                        if (err) {
                            console.log (err);
                            return;
                        }

                        // pipe temp sass file for sass function
                        that.gulp.src ('./tmp.scss')
                            .pipe (sourcemaps.init ())
                            .pipe (sass ({
                                outputStyle : 'compressed'
                            }))
                            .pipe (rename ('app.min.css'))
                            .pipe (sourcemaps.write ('./www/assets/css'))
                            .pipe (that.gulp.dest ('./www/assets/css'))
                            .on ('end', () => {
                                fs.unlinkSync ('./tmp.scss');
                            });
                    });
                });
        }, this.wait);
    }

    /**
     * daemon task
     */
    daemon () {
        // grab daemon controllers
        var daemons = [];
        for (var i = 0; i < this._tasks['daemon'].length; i ++) {
            daemons = daemons.concat (glob.sync (this._tasks['daemon'][i]));
        }

        // loop daemons
        for (var key in daemons) {
            daemons[key] = daemons[key].replace ('./', '/');
        }

        // write daemons cache file
        fs.writeFile ('./cache/daemons.json', JSON.stringify (daemons), function (err) {
            if (err) {
                return console.log (err);
            }
        });
    }

    /**
     * route task
     */
    config () {
        // set variables
        var that = this;
        var all  = {};

        // get all routes
        // do within setTimeout to remove empty files
        setTimeout (() => {
            this.gulp.src (this._tasks['config']).pipe (through.obj (function (chunk, enc, cb) {
                var pip = this;
                configPipe.pipe (chunk).then (result => {
                    pip.push ({
                        'result' : result
                    });
                    cb (null, chunk);
                });
            })).on ('data', (data) => {
                that._merge (all, data.result);
            }).on ('end', function () {
                fs.writeFile ('./cache/config.json', JSON.stringify (all), function (err) {
                    if (err) {
                        return console.log (err);
                    }
                });
            });
        }, this.wait);
    }

    /**
     * view task
     */
    view () {
        // move views into single folder
        // do within setTimeout to remove empty files
        // @todo bundle priority
        setTimeout (() => {
            this.gulp.src (
                this._tasks['view']
            )
                .pipe (rename ((filePath) => {
                    var amended      = filePath.dirname.split (path.sep);
                    amended.shift ();
                    amended.shift ();
                    filePath.dirname = amended.join (path.sep);
                }))
                .pipe (chmod (755))
                .pipe (this.gulp.dest ('cache/view'));
        }, this.wait);
    }

    /**
     * tag task
     */
    tag () {
        // move tags into javascript compiled file (riotjs)
        // do within setTimeout to remove empty files
        setTimeout (() => {
            this.gulp.src (
                this._tasks['tag']
            )
                .pipe (rename (function (filePath) {
                    var amended = filePath.dirname.split (path.sep);
                    amended.shift ();
                    amended.shift ();
                    amended.shift ();
                    filePath.dirname = amended.join (path.sep);
                }))
                .pipe (riot ({
                    compact : true
                }))
                .pipe (concat ('tags.min.js'))
                .pipe (insert.prepend ('var riot = require(\'riot\');'))
                .pipe (this.gulp.dest ('./cache/tag'));
        }, this.wait);
    }

    /**
     * javascript task
     */
    js () {
        // create javascript array
        var js = [];
        js = js.concat (glob.sync ('./bin/bundles/*/resources/js/bootstrap.js'));
        js = js.concat (glob.sync ('./app/bundles/*/resources/js/bootstrap.js'));

        // browserfiy javascript
        // do within setTimeout to remove empty files
        setTimeout (() => {
            browserify ({
                entries : js
            })
                .transform (babelify)
                .bundle ()
                .pipe (source ('app.min.js'))
                .pipe (insert.prepend (fs.readFileSync ('./node_modules/bootstrap/dist/js/bootstrap.js')))
                .pipe (insert.prepend (fs.readFileSync ('./node_modules/jquery/dist/jquery.min.js')))
                .pipe (streamify (uglify ()))
                .pipe (this.gulp.dest ('./www/assets/js'));
        }, this.wait);
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
 * export gulp builder class
 *
 * @type {gulpBuilder}
 */
module.exports = new gulpBuilder ();
