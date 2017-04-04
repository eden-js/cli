/**
 * Created by Awesome on 1/30/2016.
 */

// use strict
'use strict';

// require environment
require ('./lib/env')

// require dependencies
const fs       = require ('fs-extra');
const gulp     = require ('gulp');
const glob     = require ('glob-all');
const watch    = require ('gulp-watch');
const server   = require ('gulp-develop-server');
const sequence = require ('run-sequence');

// require local dependencies
const parser = require ('lib/utilities/parser');

/**
 * build loader class
 */
class loader {
  /**
   * construct gulp class
   */
  constructor () {
    // check cache exists
    if (!fs.existsSync ('./app/cache')) {
      fs.mkdirSync ('./app/cache');
    }

    // bind methods
    this.build   = this.build.bind (this);
    this.files   = this.files.bind (this);
    this.merge   = this.merge.bind (this);
    this.restart = this.restart.bind (this);

    // bind private methods
    this._task  = this._task.bind (this);
    this._watch = this._watch.bind (this);

    // build
    this.build ();

    // add dev server task
    gulp.task ('server', ['install'], () => {
      // run server task
      server.listen ({
        'env' : {
          'NODE_ENV' : 'development'
        },
        'args' : [
          '--color'
        ],
        'path'     : './app.js',
        'execArgv' : [
          '--harmony-async-await'
        ]
      });

      // set server
      this.server = true;

      // run watch task
      gulp.start ('watch');
    });

    // build default task
    gulp.task ('default', ['server']);
  }

  /**
   * build gulpfile
   * this has to be a sync method because gulp won't change core to allow
   * async task loading
   */
  build () {
    // glob tasks
    let done       = [];
    let tasks      = glob.sync (this.files ('tasks/*.js'));
    let watchers   = [];
    let installers = [];

    // loop tasks
    for (var i = 0; i < tasks.length; i++) {
      // load task
      let task = parser.task (tasks[i]);

      // create task
      let Task = this._task (task);

      // add to default task
      if (done.indexOf (task.task) === -1) installers.push (task.task);

      // push to done
      done.push (task.task);

      // check befores
      if (task.before) {
        // push to dones
        done = done.concat (task.before);

        // remove before from defaults
        for (var a = 0; a < task.before.length; a++) {
          // set index
          let index = installers.indexOf (task.before[a]);

          // check defaults
          if (index > -1) installers.splice (index, 1);
        }
      }

      // check afters
      if (task.after) {
        // push to dones
        done = done.concat (task.after);

        // remove after from defaults
        for (var b = 0; b < task.after.length; b++) {
          // set index
          let index = installers.indexOf (task.after[b]);

          // check defaults
          if (index > -1) installers.splice (index, 1);
        }
      }

      // add watch to watchers
      if (Task.watch) watchers.push (task.task + '.watch');
    }

    // create tasks
    gulp.task ('watch',   watchers);
    gulp.task ('install', installers);
  }

  /**
   * restarts dev server
   *
   * @private
   */
  restart () {
    // check if running
    if (!this.server) return;

    // restart server
    server.restart ();
  }

  /**
   * writes config file
   *
   * @param name
   * @param obj
   */
  write (name, obj) {
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
   *
   * @returns {*}
   */
  merge (obj1, obj2) {
    // loop object
    for (var p in obj2) {
      try {
        // Property in destination object set; update its value.
        if (typeof obj2[p].constructor === Object) {
          obj1[p] = this.merge (obj1[p], obj2[p]);
        } else if (obj2[p].constructor === Array) {
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

  /**
   * returns files
   *
   * @param {Array|String} files
   *
   * @return {Array}
   */
  files (files) {
    // check array
    if (!Array.isArray (files)) files = [files];

    // let filtered files
    let filtered = [];

    // loop files
    [global.appRoot + '/lib/bundles/*/', global.appRoot + '/node_modules/*/bundles/*/', global.appRoot + '/app/bundles/*/'].forEach ((loc) => {
      // loop files
      files.forEach ((file) => {
        // push to newFiles
        filtered.push (loc + file);
      });
    });

    // return new files
    return filtered;
  }

  /**
   * runs gulp task
   *
   * @param {Object} task
   * @private
   */
  _task (task) {
    // create task
    let Task = require (task.file);
    Task = new Task (this);

    // create gulp task
    gulp.task (task.task + '.run', () => {
      // return run
      return Task.run (Task.watch ? this.files (Task.watch ()) : undefined);
    });

    // create task args
    let args = [];

    // check before
    if (task.before && task.before.length) {
      // push to args
      args = args.concat (task.before);
    }

    // push actual function
    args.push (task.task + '.run');

    // check after
    if (task.after && task.after.length) {
      // push to args
      args = args.concat (task.after);
    }

    // create task
    gulp.task (task.task, (cb) => {
      // push cb
      let newArgs = args.slice ();
      newArgs.push (cb);

      // run gulp sequence
      sequence.apply (null, newArgs);
    });

    // check watch
    if (Task.watch) {
      // create watch task
      this._watch (task.task, Task);
    }

    // return task
    return Task;
  }

  /**
   * creates watch task
   *
   * @param  {String} task
   * @param  {*} Task
   *
   * @private
   */
  _watch (task, Task) {
    // create watch task
    gulp.task (task + '.watch', () => {
      // return watch task
      return watch (this.files (Task.watch ()), () => {
        // start task
        gulp.start (task);
      });
    });
  }
}

/**
 * export loader class
 *
 * @type {loader}
 */
module.exports = new loader ();
