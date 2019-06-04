// Require dependencies
const gulp    = require('gulp');
const through = require('through2');
const deepMerge = require('deepmerge');

// Require local dependencies
const parser = require('lib/utilities/parser');

/**
 * Create Daemons Task class
 *
 * @task daemons
 */
class DaemonsTask {
  /**
   * Construct Daemons Task class
   *
   * @param {Loader} runner
   */
  constructor(runner) {
    // Set private variables
    this._runner = runner;

    // Bind public methods
    this.run = this.run.bind(this);
    this.watch = this.watch.bind(this);
  }

  /**
   * Run assets task
   *
   * @param   {array} files
   *
   * @returns {Promise}
   */
  run(files) {
    // Set variables
    let config = {};

    // Get all routes
    return gulp.src(files)
      .pipe(through.obj((chunk, enc, cb) => {
        // parse file
        config = deepMerge(config, this.parse(parser.file(chunk.path)));

        // Run callback
        cb(null, chunk);
      }))
      .on('end', () => {
        // Loop types in config
        for (const type of Object.keys(config)) {
          // Write config file
          this._runner.write(type, config[type]);
        }

        // Restart server
        this._runner.restart();
      });
  }

  /**
   * Watch task
   *
   * @return {string[]}
   */
  watch() {
    // Return files
    return [
      'daemons/**/*.js',
    ];
  }

  /**
   * parse file
   *
   * @param  {Object} file
   *
   * @return {Object}
   */
  parse(file) {
    // get mount
    const hooks     = [];
    const events    = [];
    const cluster   = file.tags.cluster ? file.tags.cluster.map(c => c.value) : null;
    const priority  = file.tags.priority ? parseInt(file.tags.priority[0].value, 10) : null;
    const endpoints = [];

    // set classes
    const daemons = [Object.assign({}, file, {
      cluster,
      priority,

      methods : undefined,
    })];

    // forEach
    file.methods.forEach((method) => {
      // combine tags
      const combinedTags = deepMerge(file.tags || {}, method.tags);

      // parse endpoints
      [...(method.tags.endpoint || [])].forEach((tag) => {
        // create route
        const endpoint = Object.assign({
          fn       : method.method,
          all      : !!method.tags.all,
          file     : file.file,
          endpoint : (tag.value || '').trim(),
          priority : method.tags.priority ? parseInt(method.tags.priority[0].value, 10) : priority,
        }, parser.acl(combinedTags));

        // push endpoint
        endpoints.push(endpoint);
      });

      // parse events
      [...(method.tags.on || [])].forEach((tag) => {
        // create route
        const e = Object.assign({
          fn       : method.method,
          all      : !!method.tags.all,
          file     : file.file,
          event    : (tag.value || '').trim(),
          priority : method.tags.priority ? parseInt(method.tags.priority[0].value, 10) : priority,
        }, parser.acl(combinedTags));

        // push event
        events.push(e);
      });

      // parse endpoints
      ['pre', 'post'].forEach((type) => {
        // pre/post
        [...(method.tags[type] || [])].forEach((tag) => {
          // create route
          const hook = Object.assign({
            type,

            fn       : method.method,
            file     : file.file,
            hook     : (tag.value || '').trim(),
            priority : method.tags.priority ? parseInt(method.tags.priority[0].value, 10) : priority,
          }, parser.acl(combinedTags));

          // push hook
          hooks.push(hook);
        });
      });
    });

    // return daemons
    return {
      daemons,

      'daemon.hooks'     : hooks,
      'daemon.events'    : events,
      'daemon.endpoints' : endpoints,
    };
  }
}

/**
 * Export Daemons Task class
 *
 * @type {DaemonsTask}
 */
module.exports = DaemonsTask;
