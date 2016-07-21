/**
 * Created by Awesome on 1/30/2016.
 */

// use strict
'use strict';

// set globals
global.appRoot = __dirname;

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
var watch      = require ('gulp-watch');
var concat     = require ('gulp-concat');
var header     = require ('gulp-header');
var rename     = require ('gulp-rename');
var server     = require ('gulp-develop-server');
var uglify     = require ('gulp-uglify');
var streamify  = require ('gulp-streamify');
var sourcemaps = require ('gulp-sourcemaps');

// import local dependencies
var config     = require ('./app/config');
var configUtil = require ('./lib/utilities/config');

/**
 * build gulp class
 */
class edenGulp {
    /**
     * construct gulp class
     */
    constructor () {
        // wait time
        this._wait = (config.gulpDelay ? parseInt (config.gulpDelay) : 500);

        // check cache exists
        if (!fs.existsSync ('./app/cache')) {
            fs.mkdirSync ('./app/cache');
        }

        // bind private methods
        this._watch   = this._watch.bind (this);
        this._restart = this._restart.bind (this);

        // bind variables
        this.gulp  = require ('gulp');
        this.serve = false;

        // bind methods
        this._tasks = {
            'wait'   : {
                'skip' : true
            },
            'tmp'    : {
                'skip' : true
            },
            'sass'   : {
                'files' : [
                    './lib/bundles/*/public/scss/**/*.scss',
                    './app/bundles/*/public/scss/**/*.scss'
                ],
                'dependencies' : [
                    'tmp'
                ]
            },
            'models' : {
                'files' : [
                    './lib/bundles/*/models/**/*.js',
                    './app/bundles/*/models/**/*.js'
                ]
            },
            'daemons' : {
                'files' : [
                    './lib/bundles/*/daemons/**/*.js',
                    './app/bundles/*/daemons/**/*.js'
                ],
            },
            'config' : {
                'files' : [
                    './lib/bundles/*/controllers/**/*.js',
                    './app/bundles/*/controllers/**/*.js',
                    './lib/bundles/*/helpers/**/*.js',
                    './app/bundles/*/helpers/**/*.js'
                ],
            },
            'tags'    : {
                'files' : [
                    './lib/bundles/*/views/**/*.mixin.js',
                    './app/bundles/*/views/**/*.mixin.js',
                    './lib/bundles/*/views/**/*.tag',
                    './app/bundles/*/views/**/*.tag'
                ],
                'dependencies' : [
                    'wait'
                ],
                'skip' : true
            },
            'js'     : {
                'files' : [
                    './lib/bundles/*/public/js/**/*.js',
                    './app/bundles/*/public/js/**/*.js'
                ],
                'dependencies' : [
                    'tags'
                ]
            },
            'assets'  : {
                'files' : [
                    './lib/bundles/*/public/assets/**/*',
                    './app/bundles/*/public/assets/**/*'
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
            // run server task
            server.listen ({
                'path' : './app.js',
                'env'  : {
                    'NODE_ENV' : 'development'
                }
            });

            // set serve
            this.serve = true;

            // start watch task
            this.gulp.start ('watch');
        });

        // add default task
        this.gulp.task ('default', ['dev']);
    }

    /**
     * waits for something before running next
     *
     * @return {Promise}
     */
    wait () {
        // return promise
        return new Promise ((resolve, reject) => {
            // run at timeout
            setTimeout (resolve, this._wait);
        });
    }

    /**
     * creates temporary sass file
     *
     * @return {gulp}
     */
    tmp () {
        // set variables
        var all  = '';

        // set running
        if (this._tmpRunning || this._sassRunning) {
            return;
        }
        this._tmpRunning = true;

        // grab gulp source for sass
        // create local variables array for sass files
        var sassFiles = [
            './lib/bundles/*/public/scss/variables.scss',
            './app/bundles/*/public/scss/variables.scss'
        ];

        // loop config sass files
        if (config.sass && config.sass.length) {
            for (var i = 0; i < config.sass.length; i ++) {
                sassFiles.push (config.sass[i]);
            }
        }

        // push local bootstrap files
        sassFiles.push ('./lib/bundles/*/public/scss/bootstrap.scss');
        sassFiles.push ('./app/bundles/*/public/scss/bootstrap.scss');

        // run gulp
        return this.gulp.src (sassFiles)
            .pipe (through.obj (function (chunk, enc, cb) {
                // run through callback
                var type = chunk.path.split ('.');
                    type = type[type.length - 1];
                if (type == 'css') {
                    var prepend = fs.readFileSync (chunk.path, 'utf8');
                    this.push ({
                        'all' : prepend + os.EOL
                    });
                } else {
                    this.push ({
                        'all' : '@import "../..' + chunk.path.replace (__dirname, '').split (path.delimiter).join ('/') + '";' + os.EOL
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
            .on ('end', () => {
                // write temp sass file
                fs.writeFileSync ('./app/cache/tmp.scss', all);

                // reset running
                this._tmpRunning = false;
            });
    }

    /**
     * sass task
     */
    sass () {
        // check running
        if (this._tmpRunning || this._sassRunning) {
            return;
        }
        this._sassRunning = true;

        // run gulp task
        return this.gulp.src ('./app/cache/tmp.scss')
            .pipe (sourcemaps.init ())
            .pipe (sass ({
                outputStyle : 'compressed'
            }))
            .pipe (rename ('app.min.css'))
            .pipe (sourcemaps.write ('./www/public/css'))
            .pipe (this.gulp.dest ('./www/public/css'))
            .on ('end', () => {
                // reset running
                this._sassRunning = false;
            });
    }

    /**
     * daemon task
     */
    models () {
        // grab daemon controllers
        var files = [];
        for (var i = 0; i < this._tasks.models.files.length; i++) {
            files = files.concat (glob.sync (this._tasks.models.files[i]));
        }

        // loop models
        var models = {};
        for (var key in files) {
            models[files[key].split ('/')[(files[key].split ('/').length - 1)].split ('.')[0].toLowerCase ()] = files[key].replace ('./', '/');
        }

        // write daemons cache file
        this._write ('models', models);

        // restart server
        this._restart ();
    }

    /**
     * daemon task
     */
    daemons () {
        // grab daemon controllers
        var daemons = [];
        for (var i = 0; i < this._tasks.daemons.files.length; i++) {
            daemons = daemons.concat (glob.sync (this._tasks.daemons.files[i]));
        }

        // loop daemons
        for (var key in daemons) {
            daemons[key] = daemons[key].replace ('./', '/');
        }

        // write daemons cache file
        this._write ('daemons', daemons);

        // restart server
        this._restart ();
    }

    /**
     * route task
     */
    config () {
        // set variables
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
                // set pipe
                var pipe = this;

                // run pipe chunk
                configUtil.pipe (chunk).then (result => {
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
                this._merge (all, data.result);
            })
            .on ('end', () => {
                // write config file
                this._write ('config', all);

                // reset running tag
                this._configRunning = false;

                // restart server
                this._restart ();
            });
    }

    /**
     * tag task
     */
    tags () {
        // ensure running only once
        if (this._tagsRunning) {
            return;
        }
        this._tagsRunning = true;

        // create header
        var riotHeader = '';
        for (var key in config.view.include) {
            riotHeader += 'var ' + key + ' = require ("' + config.view.include[key] + '");';
        }

        // return promise
        return new Promise ((resolve, reject) => {
            // move views into single folder
            this.gulp.src (this._tasks.tags.files)
                .pipe (rename ((filePath) => {
                    var amended = filePath.dirname.split (path.sep);
                    amended.shift ();
                    amended.shift ();
                    filePath.dirname = amended.join (path.sep);
                }))
                .pipe (this.gulp.dest ('./app/cache/views'))
                .on ('end', () => {
                    this.gulp.src (this._tasks.tags.files)
                        .pipe (riot ({
                            compact : true
                        }))
                        .pipe (concat ('tags.min.js'))
                        .pipe (header (riotHeader))
                        .pipe (this.gulp.dest ('./app/cache'))
                        .on ('end', () => {
                            // reset running flag
                            this._tagsRunning = false;

                            // resolve
                            return resolve (true);
                        });
                });
        });
    }

    /**
     * javascript task
     */
    js () {
        // ensure running only once
        if (this._jsRunning) {
            return;
        }
        this._jsRunning = true;

        // create javascript array
        var js = [];
        js = js.concat (glob.sync ('./lib/bundles/*/public/js/bootstrap.js'));
        js = js.concat (glob.sync ('./app/bundles/*/public/js/bootstrap.js'));

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
            entries : js,
            paths   : [
                './',
                './app/bundles',
                './lib/bundles',
                './node_modules'
            ]
        })
            .transform (babelify)
            .bundle ()
            .pipe (source ('app.min.js'))
            .pipe (streamify (header (vendor)))
            .pipe (streamify (uglify ()))
            .pipe (this.gulp.dest ('./www/public/js'))
            .on ('end', () => {
                // reset running flag
                this._jsRunning = false;

                // restart server
                this._restart ();
            });
    }

    /**
     * image task
     */
    assets () {
        // move images into single folder
        // do within setTimeout to remove empty files
        // @todo bundle priority
        setTimeout (() => {
            this.gulp.src (this._tasks.assets.files)
                .pipe (rename ((filePath) => {
                    var amended = filePath.dirname.split (path.sep);
                    amended.shift ();
                    amended.shift ();
                    amended.shift ();
                    filePath.dirname = amended.join (path.sep);
                }))
                .pipe (this.gulp.dest ('www/public/assets'));
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
     * restarts dev server
     *
     * @private
     */
    _restart () {
        // check if running
        if (!this.serve) {
            return;
        }

        // restart server
        server.restart ();
    }

    /**
     * writes config file
     *
     * @param name
     * @param obj
     */
    _write (name, obj) {
        fs.writeFile ('./app/cache/' + name + '.json', JSON.stringify (obj), function (err) {
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
 * export eden gulp class
 *
 * @type {edenGulp}
 */
module.exports = new edenGulp ();
