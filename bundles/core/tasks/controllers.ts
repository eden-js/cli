// json5
import JSON5 from 'json5';

/**
 * Create Controllers Task class
 *
 * @task controllers
 * @parallel
 */
export default class ControllersTask {
  /**
   * Construct Controllers Task class
   *
   * @param {Loader} runner
   */
  constructor(cli) {
    // Set private variables
    this.cli = cli;

    // Bind public methods
    this.run   = this.run.bind(this);
    this.watch = this.watch.bind(this);
  }

  /**
   * run in background
   *
   * @param {*} files
   */
  async run(files) {
    // run models in background
    const threadData = await this.cli.thread(this.thread, {
      files   : files.filter((f) => f.includes('/controllers/')),
      parser  : require.resolve(`${global.edenRoot}/lib/parser`),
      appRoot : global.appRoot,
    });

    // config
    const clusters = Array.from((threadData.controllers || []).reduce((accum, controller) => {
      // clusters
      const subClusters = Array.isArray(controller.cluster) ? controller.cluster : [controller.cluster];

      // controller clusters
      accum.add(...subClusters);

      // return accumulator
      return accum;
    }, new Set(['front', 'back']))).filter((c) => c);

    // loop clusters for index files
    this.cli.write('.index/menus.js', `module.exports = ${JSON5.stringify(threadData.menus)}`);

    // create matrix
    const controllers = threadData.controllers.sort((a, b) => {
      // check priority
      if ((a.priority || 0) > (b.priority || 0)) return 1;
      if ((a.priority || 0) < (b.priority || 0)) return -1;

      // return 0
      return 0;
    }).reduce((accum, controller) => {
      // check controller
      if (!accum[controller.file]) accum[controller.file] = controller;

      // return accumulator
      return accum;
    }, {});

    // create actual controller file
    const matrix = clusters.reduce((accum, c) => {
      // clusters

      // add cluster to accumulator
      accum[c] = Object.values(controllers).filter((v) => !v.cluster || v.cluster.includes(c)).map((controller) => {
        // return file
        return `
// ${controller.file} START

exporting['${controller.file}'] = {
  ctrl : require('${controller.path}'),
  data : ${JSON5.stringify(controller)},
${['calls', 'hooks', 'routes', 'events', 'endpoints'].map((type) => {
  return `  ${type} : ${JSON5.stringify(threadData[type].filter((item) => item.file === controller.file).map((item) => {
    // new item
    const newItem = Object.assign({}, item);

    // result
    delete newItem.file;

    // return item
    return newItem;
  }).sort((a, b) => {
    // check priority
    if ((a.priority || 0) > (b.priority || 0)) return 1;
    if ((a.priority || 0) < (b.priority || 0)) return -1;

    // return 0
    return 0;
  }))},`;
}).join('  \n')}
};

// ${controller.file} END
`;
      }).join('\n\n// -------------------------\n\n');

      // return accum
      return accum;
    }, {});

    // keys
    await Promise.all(Object.keys(matrix).map((key) => {
      // set cluster imports
      this.cli.set(`cluster.${key}.controllers`, `${key}/controllers.js`);

      // create indexed matrix
      return this.cli.write(`${key}/controllers.js`, `const exporting = {};\n\n${matrix[key]}\n\nmodule.exports = exporting;`);
    }));

    // show loaded
    return `${Object.keys(controllers).length.toLocaleString()} controllers loaded!`;
  }

  /**
   * Run assets task
   *
   * @return {Promise}
   */
  async thread(data) {
    // Require dependencies
    const glob      = require('@edenjs/glob');
    const deepMerge = require('deepmerge');

    // Require local dependencies
    const parser = require(data.parser);

    // parse
    const parse = (file, path) => {
      // get mount
      const mount    = file.tags.mount ? file.tags.mount[0].value : '';
      const cluster  = file.tags.cluster ? file.tags.cluster.map(c => c.value) : null;
      const priority = file.tags.priority ? parseInt(file.tags.priority[0].value, 10) : 10;

      // skip custom methods
      const skip = ['call', 'param', 'return', 'returns', 'method', 'route', 'priority', 'acl', 'fail', 'upload'];
      const single = ['view', 'title', 'layout', 'cache', 'icon', 'menu', 'parent'];

      // controller
      const controller = Object.assign({}, file, {
        path,
        cluster,
        priority,
      });

      // delete
      delete controller.tags;
      delete controller.method;
      delete controller.methods;

      // set controllers
      const controllers = [controller];

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
            let routeTag = method.tags[key].map((val) => {
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

            // set to first element of array
            if (single.includes(key)) [routeTag] = routeTag;

            // set to key
            route[key] = routeTag;
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
            menus.push({
              acl      : route.acl,
              type     : menu.type,
              icon     : route.icon,
              route    : route.path,
              title    : menu.value,
              parent   : route.parent,
              priority : route.priority,
            });
          });
        });
      });

      // return parsed stuff
      return {
        calls,
        hooks,
        events,
        routes,
        endpoints,
        controllers,

        menus : menus.reduce((accum, menu) => {
          // set menu
          if (!accum[menu.type]) accum[menu.type] = [];

          // push menu
          accum[menu.type].push(menu);

          // return accum
          return accum;
        }, {}),
      };
    };

    // Set config
    let config = {};

    // run through files
    const files = await glob(data.files);

    // loop files
    files.forEach((file) => {
      // parse file
      config = deepMerge(config, parse(parser.file(file), file));
    });

    // return config
    return config;
  }

  /**
   * Watch task
   *
   * @return {string[]}
   */
  watch () {
    // return find string
    return '/{controllers,helpers}/**/*.{js,jsx,ts,tsx}';
  }
}
