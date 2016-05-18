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
var riot       = require ('gulp-riot');
var sass       = require ('gulp-sass');
var chmod      = require ('gulp-chmod');
var watch      = require ('gulp-watch');
var concat     = require ('gulp-concat');
var header     = require ('gulp-header');
var rename     = require ('gulp-rename');
var uglify     = require ('gulp-uglify');
var nodemon    = require ('gulp-nodemon');
var streamify  = require ('gulp-streamify');
var sourcemaps = require ('gulp-sourcemaps');

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

        // check cache exists
        if (!fs.existsSync ('./cache')) {
            fs.mkdirSync ('./cache');
        }

        // bind private methods
        this._watch = this._watch.bind (this);

        // bind variables
        this.gulp = require ('gulp');

        // bind methods
        this._tasks = {
            'tmp'    : {
                'skip' : true
            },
            'sass'   : {
                'files' : [
                    './bin/bundles/*/resources/scss/**/*.scss',
                    './app/bundles/*/resources/scss/**/*.scss'
                ],
                'dependencies' : [
                    'tmp'
                ]
            },
            'daemon' : {
                'files' : [
                    './bin/bundles/*/daemon/**/*Daemon.js',
                    './app/bundles/*/daemon/**/*Daemon.js'
                ],
            },
            'config' : {
                'files' : [
                    './bin/bundles/*/controller/**/*Controller.js',
                    './app/bundles/*/controller/**/*Controller.js',
                    './bin/bundles/*/helper/**/*Helper.js',
                    './app/bundles/*/helper/**/*Helper.js'
                ],
            },
            'view'   : {
                'files' : [
                    './bin/bundles/*/view/**/*.hbs',
                    './app/bundles/*/view/**/*.hbs'
                ],
            },
            'tag'    : {
                'files' : [
                    './bin/bundles/*/view/tag/**/*.tag',
                    './app/bundles/*/view/tag/**/*.tag'
                ],
                'skip' : true
            },
            'js'     : {
                'files' : [
                    './bin/bundles/*/resources/js/**/*.js',
                    './app/bundles/*/resources/js/**/*.js'
                ],
                'dependencies' : [
                    'tag'
                ]
            },
            'image'  : {
                'files' : [
                    './bin/bundles/*/resources/image/**/*',
                    './app/bundles/*/resources/image/**/*'
                ]
            }
        };

        // set keys array
        var keys     = Object.keys (this._tasks);
        var install  = [];
        var watchers = [];

        // bind and add gulp task methods
        for (var i = 0; i < keys.length; i++) {
            // set task
            let task = keys[i];
            // bind method
            this[task] = this[task].bind (this);
            // setup task
            if (this._tasks[task].dependencies) {
                this.gulp.task (task, this._tasks[task].dependencies, this[task]);
            } else {
                this.gulp.task (task, this[task]);
            }
            // check for skip
            if (this._tasks[task].skip) {
                continue;
            }
            // setup watch task
            var files = this._tasks[task].files;
            if (this._tasks[task].dependencies) {
                for (var a = 0; a < this._tasks[task].dependencies.length; a++) {
                    files = files.concat (this._tasks[this._tasks[task].dependencies[a]].files || []);
                }
            }
            // create watch task
            this._watch (task, files);
            // push to install
            install.push (task);
            // add watch task to array
            watchers.push (task + ':watch');
        }

        // add install task
        this.gulp.task ('install', install);
        // add watch task
        this.gulp.task ('watch', watchers);
        // add dev server task
        this.gulp.task ('dev', ['install'], () => {
            // run nodemon task
            nodemon ({
                'script' : './app.js',
                'ext'    : 'js json',
                'ignore' : [
                    'tags.min.js'
                ],
                'delay'  : this.wait,
                'watch'  : [
                    'cache/'
                ],
                'env'    : {
                    'NODE_ENV' : 'development'
                }
            });

            // start watch task
            this.gulp.start ('watch');
        });
        // add default task
        this.gulp.task ('default', ['dev']);
    }

    /**
     * creates temporary sass file
     *
     * @return {gulp}
     */
    tmp () {
        // set variables
        var that = this;
        var all  = '';

        // set running
        if (this._tmpRunning || this._sassRunning) {
            return;
        }
        this._tmpRunning = true;

        // grab gulp source for sass
        // create local variables array for sass files
        var sassFiles = [
            './bin/bundles/*/resources/scss/variables.scss',
            './app/bundles/*/resources/scss/variables.scss'
        ];

        // loop config sass files
        if (config.sass && config.sass.length) {
            for (var i = 0; i < config.sass.length; i ++) {
                sassFiles.push(config.sass[i]);
            }
        }

        // push local bootstrap files
        sassFiles.push('./bin/bundles/*/resources/scss/bootstrap.scss');
        sassFiles.push('./app/bundles/*/resources/scss/bootstrap.scss');

        // run gulp
        return this.gulp.src (sassFiles)
            .pipe (through.obj (function (chunk, enc, cb) {
                // run through callback
                var type = chunk.path.split('.');
                    type = type[type.length - 1];
                if (type == 'css') {
                    var prepend = fs.readFileSync(chunk.path, 'utf8');
                    this.push ({
                        'all' : prepend + os.EOL
                    });
                } else {
                    this.push ({
                        'all' : '@import "..' + chunk.path.replace (__dirname, '').split (path.delimiter).join ('/') + '";' + os.EOL
                    });
                }

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
                fs.writeFileSync ('./cache/tmp.scss', all);

                // reset running
                that._tmpRunning = false;
            });
    }

    /**
     * sass task
     */
    sass () {
        // set that
        var that = this;

        // check running
        if (this._tmpRunning || this._sassRunning) {
            return;
        }
        this._sassRunning = true;

        // run gulp task
        return this.gulp.src ('./cache/tmp.scss')
            .pipe (sourcemaps.init ())
            .pipe (sass ({
                outputStyle : 'compressed'
            }))
            .pipe (rename ('app.min.css'))
            .pipe (sourcemaps.write ('./www/assets/css'))
            .pipe (that.gulp.dest ('./www/assets/css'))
            .on ('end', () => {
                // reset running
                that._sassRunning = false;
            });
    }

    /**
     * daemon task
     */
    daemon () {
        // grab daemon controllers
        var daemons = [];
        for (var i = 0; i < this._tasks.daemon.files.length; i++) {
            daemons = daemons.concat (glob.sync (this._tasks.daemon.files[i]));
        }

        // loop daemons
        for (var key in daemons) {
            daemons[key] = daemons[key].replace ('./', '/');
        }

        // write daemons cache file
        this._write ('daemons', daemons);
    }

    /**
     * route task
     */
    config () {
        // set variables
        var that = this;
        var all  = {};

        // set running
        if (this._configRunning) {
            return;
        }
        this._configRunning = true;

        // get all routes
        // do within setTimeout to remove empty files
        return this.gulp.src (this._tasks.config.files)
            .pipe (through.obj (function (chunk, enc, cb) {
                var pipe = this;
                configPipe.pipe (chunk).then (result => {
                    // push to pipe
                    pipe.push ({
                        'result' : result
                    });

                    // run callback
                    cb (null, chunk);
                });
            }))
            .on ('data', (data) => {
                // merge config object
                that._merge (all, data.result);
            })
            .on ('end', function () {
                // write config file
                that._write ('config', all);

                // reset running tag
                that._configRunning = false;
            });
    }

    /**
     * view task
     */
    view () {
        // set that
        var that = this;

        // ensure running only once
        if (this._viewRunning) {
            return;
        }
        this._viewRunning = true;

        // move views into single folder
        // do within setTimeout to remove empty files
        // @todo bundle priority
        return this.gulp.src (this._tasks.view.files)
            .pipe (rename ((filePath) => {
                var amended = filePath.dirname.split (path.sep);
                amended.shift ();
                amended.shift ();
                filePath.dirname = amended.join (path.sep);
            }))
            .pipe (chmod (755))
            .pipe (this.gulp.dest ('cache/view'))
            .on('end', () => {
                // reset view running
                that._viewRunning = false;
            });
    }

    /**
     * tag task
     */
    tag () {
        // set that
        var that = this;

        // ensure running only once
        if (this._tagRunning) {
            return;
        }
        this._tagRunning = true;

        // move tags into javascript compiled file (riotjs)
        return this.gulp.src (this._tasks.tag.files)
            .pipe (riot ({
                compact : true
            }))
            .pipe (concat ('tags.min.js'))
            .pipe (header ('var riot = require(\'riot\');'))
            .pipe (this.gulp.dest ('./cache/tag'))
            .on ('end', () => {
                // reset running flag
                that._tagRunning = false;
            });
    }

    /**
     * javascript task
     */
    js () {
        // set that
        var that = this;

        // ensure running only once
        if (this._jsRunning) {
            return;
        }
        this._jsRunning = true;

        // create javascript array
        var js = [];
        js     = js.concat (glob.sync ('./bin/bundles/*/resources/js/bootstrap.js'));
        js     = js.concat (glob.sync ('./app/bundles/*/resources/js/bootstrap.js'));

        // build vendor prepend
        var vendor = '';
        if (config.js && config.js.length) {
            for (var i = 0; i < config.js.length; i++) {
                vendor += fs.readFileSync (config.js[i], 'utf8') + os.EOL;
            }
        }

        // browserfiy javascript
        // do within setTimeout to remove empty files
        return browserify ({
            entries : js
        })
            .transform (babelify)
            .bundle ()
            .pipe (source ('app.min.js'))
            .pipe (streamify (uglify ()))
            .pipe (streamify (header (vendor)))
            .pipe (this.gulp.dest ('./www/assets/js'))
            .on ('end', () => {
                // reset running flag
                that._jsRunning = false;
            });
    }

    /**
     * image task
     */
    image () {
        // move images into single folder
        // do within setTimeout to remove empty files
        // @todo bundle priority
        setTimeout (() => {
            this.gulp.src (this._tasks.image.files)
                .pipe (rename ((filePath) => {
                    var amended = filePath.dirname.split (path.sep);
                    amended.shift ();
                    amended.shift ();
                    amended.shift ();
                    filePath.dirname = amended.join (path.sep);
                }))
                .pipe (chmod (755))
                .pipe (this.gulp.dest ('www/image'));
        }, this.wait);
    }

    /**
     * creates watch task
     *
     * @param  {String} task
     * @param  {array} files
     */
    _watch (task, files) {
        // set that
        var that = this;

        // create watch task
        this.gulp.task (task + ':watch', () => {
            return watch (files, () => {
                // check running and dependencies
                if (!that['_' + task + 'Running']) {
                    that.gulp.start (task);
                }
            });
        });
    }

    /**
     * writes config file
     *
     * @param name
     * @param obj
     */
    _write (name, obj) {
        fs.writeFile ('./cache/' + name + '.json', JSON.stringify (obj), function (err) {
            if (err) {
                return console.log (err);
            }
        });
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
