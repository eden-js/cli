// Require environment
require ('./lib/env');

// Require dependencies
const fs       = require ('fs-extra');
const gulp     = require ('gulp');
const glob     = require ('glob-all');
const watch    = require ('gulp-watch');
const server   = require ('gulp-develop-server');
const sequence = require ('run-sequence');

// Require local dependencies
const parser = require ('lib/utilities/parser');

/**
 * Create Loader class
 */
class Loader {

  /**
   * Construct Loader class
   */
  constructor () {
    // Check cache exists
    if (!fs.existsSync ('./app/cache')) {
      // Create cache
      fs.mkdirSync ('./app/cache');
    }

    // Bind public methods
    this.build   = this.build.bind (this);
    this.files   = this.files.bind (this);
    this.merge   = this.merge.bind (this);
    this.restart = this.restart.bind (this);

    // Bind private methods
    this._task  = this._task.bind (this);
    this._watch = this._watch.bind (this);

    // Run build
    this.build ();

    // Add dev server task
    gulp.task ('server', ['install'], () => {
      // Run server task
      server.listen ({
        'env' : {
          'NODE_ENV' : 'development'
        },
        'args' : [
          '--color'
        ],
        'path' : './app.js'
      });

      // Set server
      this.server = true;

      // Run watch task
      gulp.start ('watch');
    });

    // Build default task
    gulp.task ('default', ['server']);
  }

  /**
   * Build Loader
   *
   * This has to be a sync method because gulp won't change core to allow async task loading
   */
  build () {
    // Glob tasks
    let done = [];

    const tasks      = glob.sync (this.files ('tasks/*.js'));
    const watchers   = [];
    const installers = [];

    // Loop tasks
    for (let i = 0; i < tasks.length; i++) {
      // Load task
      const task = parser.task (tasks[i]);

      // Create task
      let Task = this._task (task);

      // Add to default task
      if (done.indexOf (task.task) === -1) installers.push (task.task);

      // Push to done
      done.push (task.task);

      // Check befores
      if (task.before) {
        // Push to dones
        done = done.concat (task.before);

        // Remove before from defaults
        for (let a = 0; a < task.before.length; a++) {
          // Set index
          const index = installers.indexOf (task.before[a]);

          // Check defaults
          if (index > -1) installers.splice (index, 1);
        }
      }

      // Check afters
      if (task.after) {
        // Push to dones
        done = done.concat (task.after);

        // Remove after from defaults
        for (let b = 0; b < task.after.length; b++) {
          // Set index
          const index = installers.indexOf (task.after[b]);

          // Check defaults
          if (index > -1) installers.splice (index, 1);
        }
      }

      // Add watch to watchers
      if (Task.watch) watchers.push (task.task + '.watch');
    }

    // Create tasks
    gulp.task ('watch',   watchers);
    gulp.task ('install', installers);
  }

  /**
   * Restarts dev server
   *
   * @private
   */
  restart () {
    // Check if running
    if (!this.server) return;

    // Restart server
    server.restart ();
  }

  /**
   * Writes config file
   *
   * @param {String} name
   * @param {Object} obj
   */
  write (name, obj) {
    // Write file
    fs.writeFile ('./app/cache/' + name + '.json', JSON.stringify (obj), (err) => {
      // Check if error
      if (err) console.error (err);
    });
  }

  /**
   * Merges two objects
   *
   * @param   {Object} obj1
   * @param   {Object} obj2
   *
   * @returns {*}
   */
  merge (obj1, obj2) {
    // Loop object
    for (let p in obj2) {
      try {
        // Property in destination object set; update its value.
        if (obj2[p].constructor === Object) {
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
   * Returns files
   *
   * @param  {Array|String} files
   *
   * @return {Array}
   */
  files (files) {
    // Check array
    if (!Array.isArray (files)) files = [files];

    // Let filtered files
    let filtered = [];

    // Loop files
    [global.appRoot + '/lib/bundles/*/', global.appRoot + '/node_modules/*/bundles/*/', global.appRoot + '/app/bundles/*/'].forEach ((loc) => {
      // Loop files
      files.forEach ((file) => {
        // Push to newFiles
        filtered.push (loc + file);
      });
    });

    // Return new files
    return filtered;
  }

  /**
   * Runs gulp task
   *
   * @param   {Object} task
   *
   * @returns {*}
   *
   * @private
   */
  _task (task) {
    // Create task
    let Task = require (task.file);

    // New task
    Task = new Task (this);

    // Create gulp task
    gulp.task (task.task + '.run', () => {
      // Return run
      return Task.run (Task.watch ? this.files (Task.watch ()) : undefined);
    });

    // Create task args
    let args = [];

    // Check before
    if (task.before && task.before.length) {
      // Push to args
      args = args.concat (task.before);
    }

    // Push actual function
    args.push (task.task + '.run');

    // Check after
    if (task.after && task.after.length) {
      // Push to args
      args = args.concat (task.after);
    }

    // Create task
    gulp.task (task.task, (cb) => {
      // Push cb
      let newArgs = args.slice ();

      // Push new callback
      newArgs.push (cb);

      // Run gulp sequence
      sequence.apply (null, newArgs);
    });

    // Check watch
    if (Task.watch) {
      // Create watch task
      this._watch (task.task, Task);
    }

    // Return task
    return Task;
  }

  /**
   * Creates watch task
   *
   * @param {String} task
   * @param {*} Task
   *
   * @private
   */
  _watch (task, Task) {
    // Create watch task
    gulp.task (task + '.watch', () => {
      // Return watch task
      return watch (this.files (Task.watch ()), () => {
        // Start task
        gulp.start (task);
      });
    });
  }
}

/**
 * Export new Loader instance
 *
 * @type {Loader}
 */
module.exports = new Loader ();
