/*
  Awesome isomorphic NodeJS skeleton for structured applications.
  Just have a look at the "bundles" that make up an EdenJS application.
*/

/*
  ███████╗██████╗ ███████╗███╗   ██╗     ██╗███████╗
  ██╔════╝██╔══██╗██╔════╝████╗  ██║     ██║██╔════╝
  █████╗  ██║  ██║█████╗  ██╔██╗ ██║     ██║███████╗
  ██╔══╝  ██║  ██║██╔══╝  ██║╚██╗██║██   ██║╚════██║
  ███████╗██████╔╝███████╗██║ ╚████║╚█████╔╝███████║
  ╚══════╝╚═════╝ ╚══════╝╚═╝  ╚═══╝ ╚════╝ ╚══════╝
*/

// setup globals
global.CLI = true;

// env
require('./lib/env');

// Require dependencies
const fs               = require('fs-extra');
const cp               = require('child_process');
const uuid             = require('uuid/v4');
const path             = require('path');
const fetch            = require('node-fetch');
const JSON5            = require('json5');
const dotProp          = require('dot-prop');
const chokidar         = require('chokidar');
const Spinnies         = require('spinnies');
const deepMerge        = require('deepmerge');
const { argv }         = require('yargs');
const { Worker }       = require('worker_threads');
const { EventEmitter } = require('events');

// require local dependencies
const loader     = require('./lib/loader');
const baseConfig = require('./config');

/**
 * create eden CLI
 */
class EdenCLI extends EventEmitter {
  /**
   * construct eden CLI
   */
  constructor(data = {}) {
    // run super
    super();

    // set data
    this.__data = data;

    // bind methods
    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.index = this.index.bind(this);
    this.thread = this.thread.bind(this);

    // set building promise
    this.building = this.build();
  }

  /**
   * set key/value
   *
   * @param {*} key
   * @param {*} value
   */
  set(key, value) {
    // set value
    dotProp.set(this.__data, key, value);

    // got
    const got = this.get(key);

    // emit value
    this.emit(key.split('.')[0], got);

    // return get key
    return got;
  }

  /**
   * get value
   *
   * @param {*} key
   * @param {*} value
   */
  get(key, value) {
    // check value
    const actualValue = dotProp.get(this.__data, key);

    // check value
    if (typeof actualValue === 'undefined' && value) {
      // set
      this.set(key, value);

      // return get
      return this.get(key);
    }

    // return actual value
    return actualValue;
  }

  /**
   * create main
   *
   * @param {*} name
   * @param {*} fn
   */
  step(step, data) {
    // push to build chain
    this.set(`chain.${step}`, data);
  }

  /**
   * build as async
   */
  async build() {
    // resolver
    let resolver = null;

    // spinnies
    this.spinnies = new Spinnies({
      disableSpins : (argv.environment || 'dev') === 'live',
    });

    // return promise
    const promise = new Promise((resolve) => {
      resolver = resolve;
    });

    // push initial tasks
    this.step('edenjs-config', {
      fn       : this.buildConfig,
      message  : 'Loading config...',
      priority : 999999,
    });
    this.step('edenjs-bundles', {
      fn       : this.buildBundles,
      message  : 'Loading bundles...',
      priority : 999998,
    });
    this.step('edenjs-tasks', {
      fn       : this.buildTasks,
      message  : 'Loading tasks...',
      priority : 999997,
    });

    // build step
    let buildStep = 0;
    const building = [];

    // create nextable
    const buildNext = () => {
      // build step
      const step = buildStep;

      // add to build step
      buildStep += 1;

      // steps
      const steps = this.get('chain', {});
      const keys = Object.keys(steps).sort((a, b) => {
        // get steps
        const stepA = steps[a];
        const stepB = steps[b];

        // check priority
        if ((stepA.priority || 0) < (stepB.priority || 0)) return 1;
        if ((stepA.priority || 0) > (stepB.priority || 0)) return -1;

        // return 0
        return 0;
      });

      // get key
      const key = keys[step];

      // resolve done with build chain
      if (!key) return resolver();

      // create spinnie
      this.spinnies.add(key, {
        text : steps[key].message,
      });

      // add to next
      building.push(steps[key].fn(this, (text, noFinish, noNext) => {
        // noFinish
        if (!noFinish && keys[step]) {
          // create spinnie
          this.spinnies.succeed(keys[step], {
            text,
          });
        }

        // check noNext
        if (!noNext) {
          // run buildnext
          buildNext();
        }
      }));
    };

    // build next
    buildNext();

    // then
    await promise;
    await Promise.all(building);

    // add restart listener
    this.on('restart', () => {
      // restart
      this.start();
    });

    // launch
    await this[argv._[0]]();
  }

  /**
   * build eden
   *
   * @param {*} that
   * @param {*} next
   */
  async dev() {
    // compile
    await this.compile();

    // start
    this.start();

    // hot reload
    this.on('hot', async (type, ...args) => {
      // try/catch
      try {
        // emit build event
        await fetch(`http://localhost:${this.get('config.port')}/dev/event`, {
          body : JSON.stringify({
            type,
            args,
          }),
          headers : {
            'Content-Type'   : 'application/json',
            authentication : `AUTH:${this.get('config.secret')}`,
          },
          method : 'POST',
        });
      } catch (e) {
        // check event
        console.log(e);
      }
    });

    // steps
    const steps = this.get('chain', {});

    // loop tasks
    Object.keys(this.get('tasks')).forEach((key, i) => {
      // watcher
      const watcher = this.get(`task.${key}`).watch();

      // create runner function
      this.set(`runner.${key}`, async () => {
        // running
        await this.running;

        // create id
        const id = uuid();

        // create spinnie
        this.spinnies.add(id, {
          text : steps[key].message,
        });

        // run function
        this.running = steps[key].fn(this, (text, noFinish, noNext) => {
          // noFinish
          if (!noFinish && steps[key]) {
            // create spinnie
            this.spinnies.succeed(id, {
              text,
            });
          }

          // check if parent
          if (!noNext && steps[key].parent) {
            // run parent
            this.get(`runner.${steps[key].parent}`)();
          }
        });
      });

      // watch
      chokidar.watch(this.get('bundles').map((b) => `${b.path}${watcher}`, {
        ignoreInitial : true,
      }))
        .on('change', this.get(`runner.${key}`))
        .on('unlink', this.get(`runner.${key}`));
    });
  }

  /**
   * compiles edenjs
   */
  async compile() {
    // create spinnie
    this.spinnies.add('compile', {
      text : 'Compiling',
    });

    // write memory
    await this.write('.index/data.js', `module.exports = ${JSON5.stringify(this.get('index'))};`);
    await this.write('.index/config.js', `module.exports = ${JSON5.stringify(this.get('config'))};`);
    await this.write('.index/bundles.js', `module.exports = ${JSON5.stringify(this.get('bundles'))};`);

    // entry files
    const indexes = await fs.readdir(`${global.appRoot}/.edenjs/.index`);

    // create file
    await Promise.all(Object.keys(this.get('cluster')).map(async (cluster) => {
      // entry files
      const entries = await fs.readdir(`${global.appRoot}/.edenjs/${cluster}`);

      // create file
      await this.write(`cluster.${cluster}.js`, `
// time starting up
console.log('initializing edenjs "${cluster}"');
console.time('initializing edenjs "${cluster}"');

// not CLI
global.CLI      = false;
global.cluster  = '${cluster}';
global.appRoot  = '${global.appRoot}';
global.edenRoot = '${global.edenRoot}';

${indexes.map((index) => {
    return `
// time starting up
console.time('indexing "${index.split('.')[0]}"');

// require ${index.split('.')[0]}
global.${index.split('.')[0]} = require('./.index/${index.split('.')[0]}');

// time starting up
console.timeEnd('indexing "${index.split('.')[0]}"');
`;
  }).join('')}
// time starting up
console.time('loading env');

// require env
require('${path.resolve(`${global.edenRoot}/lib/env`)}');

// time starting up
console.timeEnd('loading env');
${entries.map((entry) => {
    return `
// time starting up
console.time('requiring "${entry.split('.')[0]}"');

// require ${entry.split('.')[0]}
global.${entry.split('.')[0]} = require('./${cluster}/${entry.split('.')[0]}');

// time starting up
console.timeEnd('requiring "${entry.split('.')[0]}"');
`;
  }).join('')}

// time starting up
console.timeEnd('initializing edenjs "${cluster}"');

// time starting up
console.time('starting edenjs');

// require env
const eden = require('${path.resolve(`${global.edenRoot}/lib/eden`)}');

// start eden
eden.start().then(() => {
  // time starting up
  console.timeEnd('starting edenjs');
});
      `);
    }));

    // create spinnie
    this.spinnies.succeed('compile', {
      text : 'compiled cluster!',
    });
  }

  /**
   * worker thread logic
   *
   * @param {*} logic
   * @param {*} data
   * @param {*} noLogging
   * @param {*} e
   */
  thread(logic, data, noLogging, e) {
    // check if logic is function
    if (typeof logic !== 'string') {
      // logic stringify
      logic = logic.toString().split('\n');

      // remove first/last
      logic.pop();
      logic.shift();

      // return logic
      logic = logic.join('\n');
    }

    // return promise
    return new Promise((resolve, reject) => {
      // create new worker
      const worker = new Worker(`${global.edenRoot}/worker.js`, {
        workerData : {
          data,
          logic,
        },
        stdout : noLogging,
        stderr : noLogging,
      });

      // resolve
      worker.on('error', reject);
      worker.on('message', (message) => {
        // check done
        if (!message.event) {
          // resolve done
          return resolve(message.done);
        }
        // check event
        if (message.event && e) {
          e(...message.event);
        }
      });
      worker.on('exit', (code) => {
        // check code
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }

  /**
   * create index file
   *
   * @param {*} param0
   * @param {*} data
   */
  index(name, data, type = 'index') {
    // indexed data
    this.set(`${type}.${name}`, data);
  }

  /**
   * create index file
   *
   * @param {*} param0
   * @param {*} data
   */
  async write(p, data) {
    // ensure
    await fs.ensureDir(path.dirname(`${global.appRoot}/.edenjs/${p}`));

    // write file
    return await fs.writeFile(`${global.appRoot}/.edenjs/${p}`, data);
  }

  /**
   * start server
   */
  async start() {
    // set server
    if (this.server) {
      // dead promise
      const deadPromise = new Promise((resolve) => this.server.once('exit', resolve));

      // kill server
      this.server.kill();

      // await dying
      await deadPromise;
    }

    // server
    this.server = cp.fork(`${__dirname}/spawn.js`, [`--cluster=${argv.cluster || 'front,back'}`]);
  }

  /**
   * build dependencies
   *
   * @param {*} that
   * @param {*} next
   */
  async buildConfig(that, next) {
    // app config
    let appConfig = {};

    // load config from app
    if (await fs.exists(`${appRoot}/config.js`)) {
      // exists
      // eslint-disable-next-line global-require,import/no-dynamic-require
      appConfig = require(`${appRoot}/config.js`);
    }

    // create immutable base
    Object.keys(appConfig).forEach((key) => {
      // set value
      baseConfig[key] = appConfig[key];
    });

    // merge appconfig
    const argConfig = { ...argv };
    delete argConfig._;
    delete argConfig.$0;

    // set env
    argConfig.env = process.env;

    // loop env
    Object.keys(process.env).forEach((key) => {
      // check key
      if (['_'].includes(key)) return;

      // dotprop
      dotProp.set(argConfig, key.toLowerCase().split('_').join('.'), process.env[key]);
    });

    // set config
    that.set('config', deepMerge(baseConfig, argConfig));

    // loaded bundles
    next('config loaded!');
  }

  /**
   * build dependencies
   *
   * @param {*} that
   * @param {*} next
   */
  async buildBundles(that, next) {
    // load dependencies
    const bundlesData = Array.from(new Set(await loader.bundles(that.get('config.import.modules'), that.get('config.import.ignore')))).reduce((accum, bundle) => {
      // get data
      let bundleData = {};

      // check data
      if (fs.existsSync(`${bundle}/${bundle}.js`)) {
        // require bundle data
        // eslint-disable-next-line global-require,import/no-dynamic-require
        bundleData = require(`${bundle}/${bundle}.js`);
      }
      if (fs.existsSync(`${bundle}/${bundle}.ts`)) {
        // eslint-disable-next-line global-require,import/no-dynamic-require
        bundleData = require(`${bundle}/${bundle}.ts`);
      }

      // accumulator
      accum[bundle] = {
        path     : bundle,
        priority : bundleData.priority || (bundle.includes(global.appRoot) && !bundle.includes('/node_modules/') ? 11 : 10),
        ...bundleData,
      };

      // return accum
      return accum;
    }, {});

    // create bundles
    const bundles = Object.keys(bundlesData).sort((a, b) => {
      // get steps
      const bundleA = bundlesData[a];
      const bundleB = bundlesData[b];

      // check priority
      if ((bundleA.priority || 0) < (bundleB.priority || 0)) return 1;
      if ((bundleA.priority || 0) > (bundleB.priority || 0)) return -1;

      // return 0
      return 0;
    }).map((b) => bundlesData[b]);

    // set bases
    that.set('bundles', bundles);

    // log bundles
    const bases = Array.from(new Set(that.get('bundles').map((b) => b.path.split('/bundles/')[0])));

    // bases
    that.set('bases', bases);

    // loop bases to add config
    await Promise.all(bases.map(async (base) => {
      // check config
      if (await fs.exists(`${base}/config.js`)) {
        // merge config
        // eslint-disable-next-line global-require,import/no-dynamic-require
        that.set('config', deepMerge(require(`${base}/config.js`), that.get('config')));
      }
      if (await fs.exists(`${base}/config.ts`)) {
        // merge config
        // eslint-disable-next-line global-require,import/no-dynamic-require
        that.set('config', deepMerge(require(`${base}/config.ts`), that.get('config')));
      }
    }));

    // loaded bundles
    next(`${that.get('bundles').length.toLocaleString()} bundles loaded!`);
  }

  /**
   * build dependencies
   *
   * @param {*} that
   * @param {*} next
   */
  async buildTasks(that, next) {
    // load dependencies
    const tasks = await loader.find(that.get('bundles').map((b) => b.path), '/tasks/*.ts');

    // require parser later
    // eslint-disable-next-line global-require
    const parser = require('./lib/parser');

    // set bases
    that.set('tasks', Array.from(new Set(tasks)).reduce((accum, task) => {
      // parse task
      const parsedTask = parser.task(task);

      // set task
      accum[parsedTask.task] = parsedTask;

      // return accum
      return accum;
    }, {}));

    // check dev
    if (!['dev', 'compile'].includes(argv._[0])) {
      // return nothing else
      next(`${Object.keys(that.get('tasks')).length.toLocaleString()} tasks loaded!`);
    }

    // loop tasks
    Object.keys(that.get('tasks')).forEach((key, i) => {
      // task
      const task = that.get(`tasks.${key}`);

      // add task
      that.step(task.task, {
        fn : async (t, subNext) => {
          // get task controller
          let taskController = that.get(`task.${task.task}`);

          // check loaded
          if (!taskController) {
            // load and then launch
            // eslint-disable-next-line global-require,import/no-dynamic-require
            const TaskController = require(task.file);

            // create controller
            taskController = new TaskController(that);

            // create task controller
            that.set(`task.${task.task}`, taskController);
          }

          // return run
          const done = taskController.run(await loader.find(that.get('bundles').map((b) => b.path), await taskController.watch()));

          // return next
          if (task.parallel) {
            // sub next
            subNext('', true);
          }

          // next
          subNext(await done, false, task.parallel);
        },
        message  : task.message || `Building ${task.task}`,
        priority : task.priority || (100 + i),

        ...task,
      });
    });

    // check dev
    if (['dev', 'compile'].includes(argv._[0])) {
      // after next
      next(`${Object.keys(that.get('tasks')).length.toLocaleString()} tasks loaded!`);
    }
  }
}

/**
 * export default edenJS
 *
 * @type {EdenJS}
 */
// eslint-disable-next-line no-new
new EdenCLI();
