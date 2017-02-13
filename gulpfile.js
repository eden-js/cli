/**
 * Created by Awesome on 1/30/2016.
 */

// use strict
'use strict';

// set globals
global.appRoot = __dirname;

// require dependencies
const fs         = require ('fs-extra');
const os         = require ('os');
const glob       = require ('glob');
const path       = require ('path');
const source     = require ('vinyl-source-stream');
const through    = require ('through2');
const babelify   = require ('babelify');
const browserify = require ('browserify');

// require gulp dependencies
const riot       = require ('gulp-riot');
const sass       = require ('gulp-sass');
const watch      = require ('gulp-watch');
const buffer     = require ('vinyl-buffer');
const concat     = require ('gulp-concat');
const header     = require ('gulp-header');
const rename     = require ('gulp-rename');
const server     = require ('gulp-develop-server');
const uglify     = require ('gulp-uglify');
const sourcemaps = require ('gulp-sourcemaps');

// require local dependencies
const config       = require ('./app/config');
const configParser = require ('./lib/utilities/parser');

/**
 * build edenBuilder class
 */
class edenBuilder {
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
        ]
      },
      'config' : {
        'files' : [
          './lib/bundles/*/controllers/**/*.js',
          './app/bundles/*/controllers/**/*.js',
          './lib/bundles/*/helpers/**/*.js',
          './app/bundles/*/helpers/**/*.js'
        ]
      },
      'views'    : {
        'files' : [
          './lib/bundles/*/views/**/*.js',
          './app/bundles/*/views/**/*.js',
          './lib/bundles/*/views/**/*.tag',
          './app/bundles/*/views/**/*.tag'
        ],
        'dependencies' : [
          'wait'
        ],
        'skip' : true
      },
      'tags'    : {
        'files' : [
          './lib/bundles/*/views/**/*.js',
          './app/bundles/*/views/**/*.js',
          './lib/bundles/*/views/**/*.tag',
          './app/bundles/*/views/**/*.tag'
        ],
        'dependencies' : [
          'views'
        ],
        'skip' : true
      },
      'serviceworker' : {
        'skip' : true
      },
      'js'     : {
        'files' : [
          './lib/bundles/*/public/js/**/*.js',
          './app/bundles/*/public/js/**/*.js'
        ],
        'dependencies' : [
          'tags',
          'serviceworker'
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
    let keys     = Object.keys (this._tasks);
    let install  = [];
    let watchers = [];

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
        'env'      : {
          'NODE_ENV' : 'development'
        },
        'path'     : './app.js',
        'execArgv' : [
          '--harmony-async-await'
        ]
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
    let all  = '';

    // grab gulp source for sass
    // create local variables array for sass files
    let sassFiles = [
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
        let type = chunk.path.split ('.');
            type = type[type.length - 1];

        // check type
        if (type == 'css') {
          // prepend
          let prepend = fs.readFileSync (chunk.path, 'utf8');

          // push to this
          this.push ({
            'all' : prepend + os.EOL
          });
        } else {
          // push to this
          this.push ({
            'all' : '@import "../..' + chunk.path.replace (__dirname, '').split (path.sep).join ('/').split (path.delimiter).join ('/') + '";' + os.EOL
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
      });
  }

  /**
   * sass task
   */
  sass () {
    // run gulp task
    return this.gulp.src ('./app/cache/tmp.scss')
      .pipe (sourcemaps.init ())
      .pipe (sass ({
          outputStyle : 'compressed'
      }))
      .pipe (rename ('app.min.css'))
      .pipe (sourcemaps.write ('./www/public/css'))
      .pipe (this.gulp.dest ('./www/public/css'));
  }

  /**
   * models task
   */
  models () {
    // grab model files
    let files = [];
    for (var i = 0; i < this._tasks.models.files.length; i++) {
      files = files.concat (glob.sync (this._tasks.models.files[i]));
    }

    // loop models
    let models = {};
    for (var key in files) {
      models[files[key].split ('/')[(files[key].split ('/').length - 1)].split ('.')[0].toLowerCase ()] = files[key].replace ('./', '/');
    }

    // write models cache file
    this._write ('models', models);

    // restart server
    this._restart ();
  }

  /**
   * daemon task
   */
  daemons () {
    // set variables
    let parsedDaemons = {};

    // get all routes
    return this.gulp.src (this._tasks.daemons.files)
      .pipe (through.obj (function (chunk, enc, cb) {
        // set pipe
        let pipe = this;

        // run pipe chunk
        let result = configParser.daemon (chunk);

        // push to pipe
        pipe.push ({
          'result' : result
        });

        // run callback
        cb (null, chunk);
      }))
      .on ('data', (data) => {
        // merge config object
        this._merge (parsedDaemons, data.result);
      })
      .on ('end', () => {
        // write config file
        this._write ('daemons', parsedDaemons.daemons);

        // restart server
        this._restart ();
      });
  }

  /**
   * route task
   */
  config () {
    // set variables
    let parsedConfig = {};

    // get all routes
    return this.gulp.src ([
      './lib/bundles/*/controllers/**/*.js',
      './app/bundles/*/controllers/**/*.js',
    ])
      .pipe (through.obj (function (chunk, enc, cb) {
        // set pipe
        let pipe = this;

        // run pipe chunk
        let result = configParser.parse (chunk);

        // push to pipe
        pipe.push ({
          'result' : result
        });

        // run callback
        cb (null, chunk);
      }))
      .on ('data', (data) => {
        // merge config object
        this._merge (parsedConfig, data.result);
      })
      .on ('end', () => {
        // write types
        for (var type in parsedConfig) {
          // write config file
          this._write (type, parsedConfig[type]);
        }

        // restart server
        this._restart ();
      });
  }

  /**
   * views task
   */
  views () {

    // remove views cache directory
    fs.removeSync ('./app/cache/views');

    // return running
    return this.gulp.src (this._tasks.tags.files)
      .pipe (rename ((filePath) => {
        var amended = filePath.dirname.split (path.sep);
        amended.shift ();
        amended.shift ();
        filePath.dirname = amended.join (path.sep);
      }))
      .pipe (this.gulp.dest ('./app/cache/views'));
  }

  /**
   * tag task
   */
  tags () {
    // create header
    let riotHeader = '';
    for (var key in config.view.include) {
      riotHeader += 'const ' + key + ' = require ("' + config.view.include[key] + '");';
    }

    // return promise
    return this.gulp.src ([
      './app/cache/views/**/*.js',
      './app/cache/views/**/*.tag'
    ])
      .pipe (sourcemaps.init ({
        'loadMaps' : true
      }))
      .pipe (riot ({
        'compact'    : true,
        'whitespace' : false
      }))
      .pipe (concat ('tags.js'))
      .pipe (header ('const riot = require ("riot"); const riotcontrol = require ("riotcontrol");'))
      .pipe (this.gulp.dest ('./app/cache'))
      .pipe (header (riotHeader))
      .pipe (rename ('tags.min.js'))
      .pipe (this.gulp.dest ('./app/cache'))
      .pipe (sourcemaps.write ('./app/cache'));
  }

  /**
   * javascript task
   */
  serviceworker () {
    // create javascript array
    let entries = [];
        entries = entries.concat (glob.sync ('./lib/bundles/*/public/js/serviceworker.js'));
        entries = entries.concat (glob.sync ('./app/bundles/*/public/js/serviceworker.js'));

    // browserfiy javascript
    // do within setTimeout to remove empty files
    return browserify ({
      entries : entries,
      paths   : [
        './',
        './app/bundles',
        './lib/bundles',
        './node_modules'
      ]
    })
      .transform (babelify)
      .bundle ()
      .pipe (source ('sw.min.js'))
      .pipe (buffer ())
      .pipe (sourcemaps.init ({
        'loadMaps' : true
      }))
      .pipe (uglify ({
        'compress' : true
      }))
      .pipe (sourcemaps.write ('./www/public/js'))
      .pipe (this.gulp.dest ('./www/public/js'));
  }

  /**
   * javascript task
   */
  js () {
    // create javascript array
    let entries = [];
        entries = entries.concat (glob.sync ('./lib/bundles/*/public/js/bootstrap.js'));
        entries = entries.concat (glob.sync ('./app/bundles/*/public/js/bootstrap.js'));

    // build vendor prepend
    let include = '';
    if (config.js && config.js.length) {
      for (var a = 0; a < config.js.length; a++) {
        include += fs.readFileSync (config.js[a], 'utf8') + os.EOL;
      }
    }

    // browserfiy javascript
    // do within setTimeout to remove empty files
    return browserify ({
      'debug'   : true,
      'entries' : entries,
      'paths'   : [
        './',
        './app/bundles',
        './lib/bundles',
        './node_modules'
      ]
    })
      .transform (babelify)
      .bundle ()
      .pipe (source ('app.min.js'))
      .pipe (buffer ())
      .pipe (sourcemaps.init ({
        'loadMaps' : true
      }))
      .pipe (header (include))
      .pipe (uglify ({
        'compress' : true
      }))
      .pipe (sourcemaps.write ('./www/public/js'))
      .pipe (this.gulp.dest ('./www/public/js'))
      .on ('end', () => {
        // restart server
        this._restart ();
      });
  }

  /**
   * image task
   */
  assets () {
    // move images into single folder
    // @todo bundle priority
    return this.gulp.src (this._tasks.assets.files)
      .pipe (rename ((filePath) => {
        let amended = filePath.dirname.split (path.sep);
        amended.shift ();
        amended.shift ();
        amended.shift ();
        filePath.dirname = amended.join (path.sep);
      }))
      .pipe (this.gulp.dest ('www/public/assets'));
  }

  /**
   * creates watch task
   *
   * @param  {String} task
   * @param  {array} files
   */
  _watch (task, files) {
    // create watch task
    this.gulp.task (task + ':watch', () => {
      return watch (files, () => {
        // check running and dependencies
        if (!this['_' + task + 'Running']) {
          this.gulp.start (task);
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
    // write file
    fs.writeFile ('./app/cache/' + name + '.json', JSON.stringify (obj), (err) => {
      // check if error
      if (err) console.error (err);
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
        } else if (obj2[p].constructor == Array) {
          obj1[p] = obj1[p].concat (obj2[p]);
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
 * export eden builder class
 *
 * @type {edenBuilder}
 */
module.exports = new edenBuilder ();
