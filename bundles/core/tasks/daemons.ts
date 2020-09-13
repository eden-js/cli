// json5
import JSON5 from 'json5';

/**
 * Create Daemons Task class
 *
 * @task daemons
 * @parallel
 */
export default class DaemonsTask {
  /**
   * Construct Daemons Task class
   *
   * @param {Loader} runner
   */
  constructor(cli) {
    // Set private variables
    this.cli = cli;

    // Bind public methods
    this.run = this.run.bind(this);
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
      files,

      parser  : require.resolve(`${global.edenRoot}/lib/parser`),
      appRoot : global.appRoot,
    });

    // config
    const clusters = Array.from((threadData.daemons || []).reduce((accum, daemon) => {
      // clusters
      const subClusters = Array.isArray(daemon.cluster) ? daemon.cluster : [daemon.cluster];

      // daemon clusters
      accum.add(...subClusters);

      // return accumulator
      return accum;
    }, new Set(['front', 'back']))).filter((c) => c);

    // create matrix
    const daemons = threadData.daemons.sort((a, b) => {
      // check priority
      if ((a.priority || 0) > (b.priority || 0)) return 1;
      if ((a.priority || 0) < (b.priority || 0)) return -1;

      // return 0
      return 0;
    }).reduce((accum, daemon) => {
      // check daemon
      if (!accum[daemon.file]) accum[daemon.file] = daemon;

      // return accumulator
      return accum;
    }, {});

    // create actual daemon file
    const matrix = clusters.reduce((accum, c) => {
      // clusters

      // add cluster to accumulator
      accum[c] = Object.values(daemons).filter((v) => !v.cluster || v.cluster.includes(c)).map((daemon) => {
        // return file
        return `
// ${daemon.file} START

exporting['${daemon.file}'] = {
  ctrl : require('${daemon.path}'),
  data : ${JSON5.stringify(daemon)},
${['hooks', 'events', 'endpoints'].map((type) => {
  return `  ${type} : ${JSON5.stringify(threadData[type].filter((item) => item.file === daemon.file).map((item) => {
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

// ${daemon.file} END
`;
      }).join('\n\n// -------------------------\n\n');

      // return accum
      return accum;
    }, {});

    // keys
    await Promise.all(Object.keys(matrix).map((key) => {
      // set cluster imports
      this.cli.set(`cluster.${key}.daemons`, `${key}/daemons.js`);

      // create indexed matrix
      return this.cli.write(`${key}/daemons.js`, `const exporting = {};\n\n${matrix[key]}\n\nmodule.exports = exporting;`);
    }));

    // show loaded
    return `${Object.keys(daemons).length.toLocaleString()} daemons loaded!`;
  }

  /**
   * Run assets task
   *
   * @param   {array} files
   *
   * @returns {Promise}
   */
  async thread(data) {
    // Require dependencies
    const glob      = require('@edenjs/glob');
    const deepMerge = require('deepmerge');

    // Require local dependencies
    const parser = require(data.parser);

    // create parse function
    const parse = (file, path) => {
      // get mount
      const hooks     = [];
      const events    = [];
      const cluster   = file.tags.cluster ? file.tags.cluster.map(c => c.value) : null;
      const priority  = file.tags.priority ? parseInt(file.tags.priority[0].value, 10) : 10;
      const endpoints = [];

      // daemon
      const daemon = Object.assign({}, file, {
        path,
        cluster,
        priority,
      });

      // delete
      delete daemon.type;
      delete daemon.tags;
      delete daemon.method;
      delete daemon.methods;

      // set classes
      const daemons = [daemon];

      // forEach
      file.methods.forEach((method) => {
        // combine tags
        const combinedTags = deepMerge(file.tags || {}, method.tags);

        // parse endpoints
        [...(method.tags.endpoint || [])].forEach((tag) => {
          // Comply with max-length 100 (TravicCI)
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
          // Comply with max-length 100 (TravicCI)
          const methodPriority = method.tags.priority;
          // create route
          const e = Object.assign({
            fn       : method.method,
            all      : !!method.tags.all,
            file     : file.file,
            event    : (tag.value || '').trim(),
            priority : methodPriority ? parseInt(methodPriority[0].value, 10) : priority,
          }, parser.acl(combinedTags));

          // push event
          events.push(e);
        });

        // parse endpoints
        ['pre', 'post'].forEach((type) => {
          // pre/post
          [...(method.tags[type] || [])].forEach((tag) => {
            // Comply with max-length 100 (TravicCI)
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
      });

      // return daemons
      return {
        hooks,
        events,
        daemons,
        endpoints,
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
    return '/daemons/**/*.{js,jsx,ts,tsx}';
  }
}
