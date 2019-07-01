// Require dependencies
const gulp      = require('gulp');
const through   = require('through2');
const deepMerge = require('deepmerge');

// Require local dependencies
const parser = require('lib/utilities/parser');

/**
 * Create Controllers Task class
 *
 * @task controllers
 */
class ControllersTask {
  /**
   * Construct Controllers Task class
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
   * @return {Promise}
   */
  run() {
    // Set config
    let config = {};

    // Get all routes
    return gulp.src(this._runner.files('controllers/**/*.js'))
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
      'controllers/**/*.js',
      'helpers/**/*.js',
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
    const mount    = file.tags.mount ? file.tags.mount[0].value : '';
    const cluster  = file.tags.cluster ? file.tags.cluster.map(c => c.value) : null;
    const priority = file.tags.priority ? parseInt(file.tags.priority[0].value, 10) : null;

    // skip custom methods
    const skip = ['call', 'param', 'return', 'returns', 'method', 'route', 'priority', 'acl', 'fail', 'upload'];
    const single = ['view', 'title', 'layout', 'cache', 'icon', 'menu', 'parent'];

    // set classes
    const classes = [Object.assign({}, file, {
      cluster,
      priority,

      methods : undefined,
    })];

    // extract routes
    const menus = [];
    const calls = [];
    const hooks = [];
    const routes = [];
    const events = [];
    const endpoints = [];

    // forEach
    file.methods.forEach((method) => {
      // combine tags
      const combinedTags = deepMerge(file.tags || {}, method.tags);

      // parse endpoints
      [...(method.tags.endpoint || [])].forEach((tag) => {
        // Comply with max-length of 100 (TravicCI)
        const methodPriority = method.tags.priority;
        // create route
        const endpoint = Object.assign({
          fn       : method.method,
          all      : !!method.tags.all,
          file     : file.file,
          endpoint : (tag.value || '').trim(),
          priority : methodPriority ? parseInt(methodPriority[0].value, 10) : priority,
        }, parser.acl(combinedTags));

        // push endpoint
        endpoints.push(endpoint);
      });

      // parse events
      [...(method.tags.on || [])].forEach((tag) => {
        // Comply with max-length of 100 (TravicCI)
        const methodPriority = method.tags.priority;
        // create route
        const e = Object.assign({
          fn       : method.method,
          all      : !!method.tags.all,
          file     : file.file,
          event    : (tag.value || '').trim(),
          priority : methodPriority ? parseInt(methodPriority[0].value, 10) : priority,
        }, parser.acl(combinedTags));

        // push endpoint
        events.push(e);
      });

      // parse endpoints
      ['pre', 'post'].forEach((type) => {
        // pre/post
        [...(method.tags[type] || [])].forEach((tag) => {
          // Comply with max-length of 100 (TravicCI)
          const methodPriority = method.tags.priority;
          // create route
          const hook = Object.assign({
            type,

            fn       : method.method,
            file     : file.file,
            hook     : (tag.value || '').trim(),
            priority : methodPriority ? parseInt(methodPriority[0].value, 10) : priority,
          }, parser.acl(combinedTags));

          // push hook
          hooks.push(hook);
        });
      });

      // create route
      [...(method.tags.route || []), ...(method.tags.call || [])].forEach((tag) => {
        // Comply with max-length of 100 (TravicCI)
        const methodPriority = method.tags.priority;
        // create route
        const route = Object.assign({
          fn       : method.method,
          file     : file.file,
          path     : tag.tag === 'route' ? (mount + tag.value).split('//').join('/') : (tag.value || '').trim(),
          method   : tag.tag === 'route' ? (tag.type || 'get').toLowerCase() : null,
          priority : methodPriority ? parseInt(methodPriority[0].value, 10) : priority,
        }, parser.acl(combinedTags), tag.tag === 'route' ? {
          upload : parser.upload(method.tags),
        } : {});

        // check path
        if (route.path !== '/') route.path = route.path.replace(/\/$/, '');

        // loop boolean elements
        Object.keys(method.tags).filter(key => !skip.includes(key)).forEach((key) => {
          // check key
          route[key] = method.tags[key].map((val) => {
            // check type
            if (!val.type) {
              // return value
              return val.value === 'true' || val.value.trim() === '' ? true : val.value;
            }

            // return value
            return {
              type  : val.type,
              value : val.value === 'true' || val.value.trim() === '' ? true : val.value,
            };
          });

          // destructuring array for TravicCI
          const routeKey = route[key];
          const routeKey0 = routeKey[0];
          // set to 0
          if (single.includes(key)) route[key] = routeKey0;
        });

        // delete priority
        Object.keys(route).forEach((key) => {
          // delete key
          if (route[key] === null) delete route[key];
        });

        // push route
        if (tag.tag === 'route') {
          // push route
          routes.push(route);
        } else {
          // push call
          calls.push(route);
        }

        // create menu
        (method.tags.menu || []).forEach((menu) => {
          // set menu
          menus.push(Object.assign({
            acl      : route.acl,
            type     : menu.type,
            icon     : route.icon,
            route    : route.path,
            title    : menu.value,
            parent   : route.parent,
            priority : route.priority,
          }));
        });
      });
    });

    // return parsed stuff
    return {
      calls,
      routes,
      classes,

      menus : menus.reduce((accum, menu) => {
        // set menu
        if (!accum[menu.type]) accum[menu.type] = [];

        // push menu
        accum[menu.type].push(menu);

        // return accum
        return accum;
      }, {}),

      'controller.hooks'     : hooks,
      'controller.events'    : events,
      'controller.endpoints' : endpoints,
    };
  }
}

/**
 * Export Controllers Task class
 *
 * @type {ControllersTask}
 */
module.exports = ControllersTask;
