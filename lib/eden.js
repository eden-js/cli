
// Require dependencies
const uuid    = require('uuid');
const pack    = require('../package.json');
const error   = require('serialize-error');
const dotProp = require('dot-prop-immutable');

// Require class dependencies
const Events    = require('events');
const EdenModel = require('@edenjs/model');
const { Logger }  = require('winston');
const { Console } = require('winston').transports;

// Require local dependencies
const log    = require('lib/utilities/log');
const config = require('config');

// Require cached resources
const hooks     = [...(cache('controller.hooks')), ...(cache('daemon.hooks'))];
const models    = cache('models');
const events    = [...(cache('controller.events')), ...(cache('daemon.events'))];
const daemons   = cache('daemons');
const endpoints = [...(cache('controller.endpoints')), ...(cache('daemon.endpoints'))];

/**
 * Create Eden class
 */
class Eden {
  /**
   * Construct Eden class
   */
  constructor() {
    // Bind private variables
    this.__register = {
      version : pack.version,
    };

    // Bind public methods
    this.start = this.start.bind(this);
    this.error = this.error.bind(this);
    this.ready = this.ready.bind(this);
    this.require = this.require.bind(this);
    this.register = this.register.bind(this);
    this.controller = this.controller.bind(this);

    // Bind event methods
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);
    this.emit = this.emit.bind(this);
    this.once = this.once.bind(this);
    this.call = this.call.bind(this);
    this.endpoint = this.endpoint.bind(this);

    // Bind lock methods
    this.lock = this.lock.bind(this);

    // Bind hook methods
    this.pre = this.pre.bind(this);
    this.post = this.post.bind(this);
    this.hook = this.hook.bind(this);

    // Bind cache methods
    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.del = this.del.bind(this);
    this.cache = this.get.bind(this);
    this.clear = this.clear.bind(this);

    // Bind private methods
    this._logger = this._logger.bind(this);
    this._daemons = this._daemons.bind(this);
    this._database = this._database.bind(this);
  }


  // /////////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Main Methods
  //
  // /////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Starts Eden framework
   *
   * This function is called from `/app.js` in every `compute` and `express` thread.
   * The amount of threads are specified in `/app/config.js`
   * under `expressThreads` and `computeThreads`.
   *
   * @param {object} opts
   *
   * @async
   */
  async start(opts) {
    // Set variables
    this.id = parseInt(opts.id, 10);
    this.port = opts.port;
    this.host = opts.host || config.get('host') || '0.0.0.0';
    this.email = false;
    this.events = new Events();
    this.logger = opts.logger || this._logger();
    this.version = pack.version;
    this.cluster = opts.cluster;
    this.database = false;

    // Set process name
    try {
      // Set process name
      process.title = `${config.get('domain')} - ${this.cluster} #${this.id}`;
    } catch (e) { /* */ }

    // create classes
    await this._initialize();

    // Connect database
    await this._database();

    // check port
    if (this.port) {
      // Require router
      const Router = require('./eden/router'); // eslint-disable-line global-require

      // Bind Eden classes
      this.router = new Router();

      // await router building
      await this.router.building;
    }

    // Build daemons
    await this._daemons();

    // Clear all endpoints
    this.del('endpoint.*');

    // Add ping/pong logic
    this.on('eden.ping', () => {
      // Pong
      this.emit('eden.pong', `${this.cluster}.${opts.id}`, true);
    }, true);

    // Add thread specific listener
    this.on(`${this.cluster}.${opts.id}`, (data) => {
      // Emit data
      this.events.emit(data.type, ...data.args, {
        callee : data.callee,
      });
    }, true);

    // Add thread specific listener
    this.on(`${this.cluster}.all`, (data) => {
      // Emit data
      this.events.emit(data.type, ...data.args, {
        callee : data.callee,
      });
    }, true);

    // Emit ready
    this.emit('eden.ready', true, false);
    this.emit(`eden.${this.cluster}.${opts.id}.ready`, true);
  }

  /**
   * Registers value to Eden
   *
   * Eden has an internal register system for registering core logic across the application.
   * By default Eden uses this to register the view engine, file transport engine,
   * and database engine.
   *
   * Simply run `this.eden.register([name], [value])` within one of your Controllers or Daemons
   * to create/overwrite a current Eden register.
   *
   * This is not persistent cross thread. You will need to ensure you register your core
   * Eden variables in every possible Eden thread you intend to use them in.
   *
   * @param  {string} name
   * @param  {*}      value
   *
   * @return {*}
   */
  register(name, value) {
    // Check value
    if (typeof value === 'undefined') {
      // Return register
      return dotProp.get(this.__register, name);
    }

    // Set register value
    this.__register = dotProp.set(this.__register, name, value);

    // Return this
    return this;
  }

  /**
   * Requires file to register
   *
   * This just safely and gracefully requires a file. We use this to catch syntax and other errors
   * when requiring Controllers and/or Daemons.
   * However this function can be used to require any file with `this.eden.require([file])`.
   *
   * @param  {string} file
   *
   * @return {Promise}
   */
  require(file) {
    // Log which file to require to debug
    this.logger.log('debug', `Requiring ${file}`, {
      class : 'Eden',
    });

    let requiredFile = null;

    // Try catch
    try {
      // Return required file
      requiredFile = require(file); // eslint-disable-line global-require, import/no-dynamic-require
    } catch (e) {
      // Print error
      this.error(e);

      // Exit process
      process.exit();
    }

    return requiredFile;
  }

  /**
   * Get controller
   *
   * This function is the core module loader for Eden.
   * All Eden Controllers and Daemons should be required and initialized with this method
   * as to prevent them loading multiple times,
   * and to ensure they exist within the Eden Controller register.
   *
   * To use this method to call a Controller cross-bundle use:
   *
   * `this.eden.controller('app/bundles/[bundle]/controllers/[controller].js')`
   *
   * @param  {string} file
   *
   * @return {Controller}
   *
   * @async
   */
  async controller(file) {
    // Check register
    if (!this.register('controller')) this.register('controller', {});

    // Try catch
    try {
      // Find in register and check if Controller registered
      if (!this.register('controller')[file]) {
        // Require Controller class
        const callable   = endpoints.filter(e => e.file === file);
        const hookable   = hooks.filter(e => e.file === file);
        const eventable  = events.filter(e => e.file === file);
        const Controller = await this.require(file);

        // Register Controller instance
        this.register('controller')[file] = new Controller();

        // do endpoints
        callable.forEach((endpoint) => {
          // do endpoint
          this.endpoint(endpoint.endpoint, this.register('controller')[file][endpoint.fn], endpoint.all);
        });

        // do endpoints
        eventable.forEach((e) => {
          // do endpoint
          this.on(e.event, this.register('controller')[file][e.fn], e.all);
        });

        // do endpoints
        hookable.forEach((hook) => {
          // do endpoint
          this[hook.type](hook.hook, this.register('controller')[file][hook.fn], hook.priority);
        });
      }

      // Return registered Controller instance
      return this.register('controller')[file];
    } catch (e) {
      // Print error
      this.error(e);

      // Exit process
      process.exit();
    }

    return null;
  }

  /**
   * Pretty prints error
   *
   * By default Eden core passes errors through pretty print
   *
   * @param {Error} e
   */
  error(e) {
    // Log error
    global.printError(e);

    // Emit error
    this.emit('Eden.error', e);
  }

  /**
   * Returns ready
   *
   * @return {*}
   */
  async ready() {
    // Return promise
    return await new Promise(async (resolve) => {
      // Set ids
      const ids = new Map();

      // @todo old way was stupid
      resolve();
    });
  }


  // /////////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Event Methods
  //
  // /////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * on function
   *
   * `this.eden` also acts as a cross-thread event emitter.
   * Using redis you can emit and receive Eden events using:
   *
   * `this.eden.on([event name], [callback], [all threads?])`
   *
   * For example if we wanted to listen to the event `example` on every thread we would do:
   *
   * `this.eden.on('example', (...args) => {
   *   // Log args
   *   console.info(...args);
   * }, true);`
   *
   * While if we only want to listen to this event on the current thread, we would do:
   *
   * `this.eden.on('example', (...args) => {
   *   // Log args
   *   console.info(...args);
   * });`
   *
   * @param {string}   str
   * @param {function} fn
   * @param {boolean}  all
   */
  on(str, fn, all) {
    // On str/fn
    if (all) {
      // Pubsub on
      this.register('pubsub').on(str, fn);
    } else {
      // Add event listener
      this.events.on(str, fn);
    }
  }

  /**
   * On function
   *
   * `this.eden.once([event name], [callback], [all threads?])`
   *
   * For example if we wanted to listen to one event `example` on every thread we would do:
   *
   * `this.eden.once('example', (...args) => {
   *   // Log args
   *   console.info(...args);
   * }, true);`
   *
   * While if we only want to listen to this event once the current thread, we would do:
   *
   * `this.eden.once('example', (...args) => {
   *   // Log args
   *   console.info(...args);
   * });`
   *
   * @param {string}   str
   * @param {function} fn
   * @param {boolean}  all
   */
  once(str, fn, all) {
    // On str/fn
    if (all) {
      // Pubsub on
      this.register('pubsub').once(str, fn);
    } else {
      // Add event listener
      this.events.once(str, fn);
    }
  }

  /**
   * Remove event listener function
   *
   * This method removes an event listener from either all
   * or the current thread to do this simply run:
   *
   * `this.eden.off([event name], [callback], [all threads?])`
   *
   * @param {string}   str
   * @param {function} fn
   * @param {boolean}  all
   *
   * @return {*}
   */
  off(str, fn, all) {
    // Emit function
    return !all ? this.events.removeListener(str, fn) : this.register('pubsub').removeListener(str, fn);
  }

  /**
   * Call endpoint cross threads
   *
   * This method allows you to call an endpoint in another thread.
   * Usually used for inter-daemon communication
   * (Daemons running on different threads).
   *
   * To call a method we need to ensure that the endpoint we expect
   * has been registered in the other thread using:
   *
   * `this.eden.endpoint([endpoint name], [endpoint function])`
   *
   * When we call an endpoint, we expect the above to return
   *  an async response,we do this by doing:
   *
   * `const response = await this.eden.call([endpoint name], [...args])`
   *
   * @param  {string} str
   * @param  {array}  args
   *
   * @return {Promise}
   */
  call(str, ...args) {
    // Set all
    const all = typeof args[args.length - 1] === 'boolean' ? args[args.length - 1] : false;

    // Set id
    const id = uuid();

    // Create emission
    const emission = {
      id,
      str,
      args,
    };

    // Emit to socket
    this.emit(`eden.call.${str}`, emission, !!all);

    // Await one response
    return new Promise((resolve, reject) => {
      // On message
      this.once(id, (res) => {
        // check success
        if (!res.success) {
          // deserialize error
          const error = new Error(res.error.message);

          // set stack
          error.stack = res.error.stack;

          // throw error
          reject(error);
        }

        // resolve result
        resolve(res.result);
      }, !!all);
    });
  }

  /**
   * Receive call cross threads
   *
   * This method allows you to register an endpoint in any thread.
   * Usually used for inter-daemon communication
   * (Daemons running on different threads).
   *
   * to register a method we need to do the following:
   *
   * `this.eden.endpoint([endpoint name], [endpoint function], true)`
   *
   * @param  {string}   str
   * @param  {function} fn
   * @param  {boolean}  all
   */
  endpoint(str, fn, all) {
    // On connect call
    this.on(`eden.call.${str}`, async ({ id, args }, opts) => {
      // Check opts
      if (opts && opts.callee) args.push(opts);

      // check res
      let res = null;

      // try/catch
      try {
        // get real res
        res = await fn(...args);

        // Run function
        return this.emit(id, {
          result  : res,
          success : true,
        }, !!((opts && opts.callee) || all));
      } catch (e) {
        // Run function
        this.emit(id, {
          error   : error(e),
          success : false,
        }, !!((opts && opts.callee) || all));
      }
    }, !!all);
  }

  /**
   * Emit event
   *
   * this method emits an event to all or the current thread. To use this simply:
   *
   * `this.eden.emit([event name], [..arguments], [all threads?])`
   *
   * @param  {string}  str
   * @param  {array}   args
   *
   * @return {*}
   */
  emit(str, ...args) {
    // Set all
    const all = typeof args[args.length - 1] === 'boolean' ? args[args.length - 1] : false;

    // Emit function
    return !all ? this.events.emit(str, ...args) : this.register('pubsub').emit(str, ...args);
  }

  /**
   * Emit to specific thread
   *
   * This method emits an event to a specific thread. To use this simply:
   *
   * `this.eden.thread('compute', 0).emit([event name], [..arguments])`
   * `this.eden.thread('compute', 0).call([endpoint name], [..arguments])`
   *
   * @param {string} types
   * @param {string} thread
   *
   * @return {*}
   */
  thread(types, thread = null) {
    // make type an array
    if (!Array.isArray(types)) types = [types];

    // Returns thread call logic
    return {
      call : (str, ...args) => {
        // Set id
        const id = uuid();

        // Create emission
        const emission = {
          id,
          str,
          args,
        };

        // Emit to single thread
        types.forEach((type) => {
          // do pubsub type emit
          this.register('pubsub').emit(`${type}.${thread !== null ? thread : 'all'}`, {
            type   : `eden.call.${str}`,
            args   : [emission],
            callee : `${this.cluster}.${this.id}`,
          });
        });

        // Await one response
        return new Promise((resolve) => {
          // On message
          this.once(id, resolve, true);
        });
      },
      emit : (str, ...args) => {
        // Emit to single thread
        types.forEach((type) => {
          // Emit to single thread
          this.register('pubsub').emit(`${type}.${thread !== null ? thread : 'all'}`, {
            type   : str,
            args,
            callee : `${this.cluster}.${this.id}`,
          });
        });
      },
    };
  }


  // /////////////////////////////////////////////////////////////////////////////////////////////
  //  Lock Methods
  //
  // /////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Returns unlock function
   *
   * Core Eden clusters threads, this means we need to ensure we can stop other logic running
   * where we already have logic running. For example checking a user's balance.
   *
   * To lock a function and ensure other threads need to wait to do their own logic
   * on that function simply do the following:
   *
   * `const unlock = await this.eden.lock([lock name], [ttl ms])`
   *
   * Once you have finished with the logic you are running, and want to let
   * other threads have a go, simply run
   * `unlock()`
   *
   * @param  {string} key
   * @param  {number} ttl
   *
   * @return {Promise}
   *
   * @async
   */
  lock(key, ttl = 86400) {
    // create lock
    return this.register('pubsub').lock(key, ttl);
  }

  // /////////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Cache Methods
  //
  // /////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Fets (and sets) cache by key
   *
   * This method gets and returns a sanitisable object from redis.
   * It also allows you to specify a default cache value.
   * To get a value simply:
   *
   * `const value = await this.eden.get([key])`
   *
   * To get a value, or a default returned value simply:
   *
   * `const value = await this.eden.get([key], () => {
   *   // Return new value to cache for 60 seconds
   *   return {
   *     'cached' : true
   *   };
   * }, 60 * 1000)`
   *
   * @param  {string}   key
   * @param  {function} notCached
   * @param  {number}   ttl
   *
   * @return {*}
   *
   * @async
   */
  async get(key, notCached, ttl = 86400) {
    // Check cached
    if (typeof notCached === 'number') {
      // spin
      ttl = notCached;
      notCached = null;
    }

    // get value
    let value = await this.register('pubsub').get(key);

    // check value
    if (!value && notCached) {
      // lock value
      const unlock = await this.register('pubsub').lock(key);

      // await not cached
      value = await notCached();

      // cache
      this.register('pubsub').set(key, value, ttl);

      // unlock
      unlock();
    }

    // Return cached value
    return value;
  }

  /**
   * Sets cache by key
   *
   * This method allows you to set a sanitisable value in redis for use cross-thread.
   * This is used by Eden core to cache pages when
   * you use the `@cache` annotation specifying a route
   *
   * To set a value to Eden cache simply:
   *
   * `await this.eden.set([key], {
   *    'cached' : true
   * }, 60 * 1000)`
   *
   * @param  {string} key
   * @param  {*}      value
   * @param  {number} ttl
   *
   * @return {*}
   *
   * @async
   */
  set(key, value, ttl = 86400) {
    // set in pubsub
    return this.register('pubsub').set(key, value, ttl);
  }

  /**
   * Delete cache by key
   *
   * This method allows you to remove an existing cache by key from redis. To do this simply:
   *
   * `await this.eden.del([key])`
   *
   * @param   {string} key
   *
   * @returns {Promise}
   */
  del(key) {
    // set in pubsub
    return this.register('pubsub').del(key);
  }

  /**
   * Delete cache
   *
   * @param {String} key
   *
   * This method clears the _entire_ Eden lock and cache, please be careful with this
   * method as it applies cross-thread; though only to the current application
   *
   * @async
   */
  clear(key) {
    // delete key
    return this.register('pubsub').del(key);
  }


  // /////////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Hook Methods
  //
  // /////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Adds hook pre event
   *
   * Eden has an internal hook system, though it is only able
   * to hook within the thread that the hook is used
   * (hooks are not cross-thread).
   * This is because the expected hook data is not required to be sanitisable.
   *
   * To add a function to run before a hooked function, do the following:
   *
   * `this.eden.pre([hook name], [function to run])`
   *
   * @param {string}   hook
   * @param {function} fn
   */
  pre(hook, fn, priority = 10) {
    // Push pre-hook function
    this.__hook(hook);

    // add register
    this.register('hook')[hook].pre.push({
      fn,
      priority,
    });
  }

  /**
   * Add post hook to act as pre
   *
   * To add a function to run after a hooked function, do the following:
   *
   * `this.eden.post([hook name], [function to run])`
   *
   * @param {string}   hook
   * @param {function} fn
   */
  post(hook, fn, priority = 10) {
    // Push post-hook function
    this.__hook(hook);

    // add register
    this.register('hook')[hook].post.push({
      fn,
      priority,
    });
  }


  /**
   * Adds kareem hook
   *
   * This method runs an Eden hook, this simply allows us to execute cross-bundle
   * functionality on an event. This is used extensively within the core view logic.
   *
   * To await a hook simply:
   *
   * `const data = {
   *   'hello' : 'world'
   * };
   *
   * // Await hooks to run
   * await this.eden.hook('example', data, (data) => {
   *   // All pre-hooks have run at this point
   *   data.hello = 'goodbye';
   * });
   *
   * // All post hooks have run at this point
   * console.info(data);`
   *
   * @param {string} hook
   * @param {array}  args
   *
   * @async
   */
  async hook(hook, ...args) {
    // Set fn
    let fn = false;

    // Get function
    if (args.length > 1 && args[args.length - 1] instanceof Function && typeof args[args.length - 1] === 'function' && args[args.length - 1].call) {
      [fn] = args.splice(-1);
    }

    // Check hook
    const fns = this.__hook(hook);

    // Loop pre-hook functions
    for (let a = 0; a < (fns.pre || []).length; a += 1) {
      // Exec pre-hook function
      await fns.pre[a](...args, { hook, type : 'pre' });
    }

    // Exec actual function
    if (fn) await fn(...args);

    // Loop post-hook functions
    for (let b = 0; b < (fns.post || []).length; b += 1) {
      // Exec post-hook function
      await fns.post[b](...args, { hook, type : 'post' });
    }
  }

  /**
   * Checks hook
   *
   * @param {string} hook
   *
   * @returns {object} register
   *
   * @private
   */
  __hook(hook) {
    // Check register
    if (!this.register('hook')) this.register('hook', {});

    // Check hook exists
    if (!this.register('hook')[hook]) {
      // add register hook
      this.register('hook')[hook] = {
        pre  : [],
        post : [],
      };
    }

    // keys
    const keys = Object.keys(this.register('hook')).filter((key) => {
      // exact match
      if (key === hook) return true;

      // check split
      const splitA = hook.split('.');
      const splitB = key.split('.');

      // split A/B
      if (key.includes('*') && splitA.length > 1 && splitB.length > 1 && splitA.length === splitB.length) {
        // check parts
        return !splitA.find((part, i) => {
          // return match or star
          return part !== splitB[i] && splitB[i] !== '*';
        });
      }

      // return false
      return false;
    });

    // get functions
    const fns = {
      pre  : [],
      post : [],
    };

    // loop keys
    keys.forEach((key) => {
      // get register
      const { pre, post } = this.register('hook')[key] || {};

      // push post
      fns.pre.push(...(pre || []));
      fns.post.push(...(post || []));
    });

    // sort
    fns.pre = fns.pre.sort((a, b) => (b.priority || 0) - (a.priority || 0)).map(pre => pre.fn);
    fns.post = fns.post.sort((a, b) => (b.priority || 0) - (a.priority || 0)).map(post => post.fn);

    // Return register
    return fns;
  }


  // /////////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Private Methods
  //
  // /////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * initialize application
   *
   * @return {Promise}
   */
  async _initialize() {
    // get cluster
    const clusterConfig = config.get('clusterMapping')[this.cluster];

    // initialize
    this.logger.log('info', 'initializing daemon classes', {
      class : 'Eden',
    });

    // get daemons
    const daemonClasses = daemons.filter((daemon) => {
      // return cluster
      return !daemon.cluster || (clusterConfig ? clusterConfig.includes(daemon.file) : daemon.cluster.includes(this.cluster));
    }).sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // loop toload
    for (const daemon of daemonClasses) {
      // Require Daemon
      const Daemon = this.require(daemon.file);

      // check initialize
      if (Daemon.initialize) await Daemon.initialize(this);
    }

    // initialize
    this.logger.log('info', 'initialized daemon classes', {
      class : 'Eden',
    });
  }

  /**
   * Registers logger
   *
   * @return {Logger} logger
   *
   * @private
   */
  _logger() {
    // Set logger
    return new Logger({
      level      : config.get('logLevel') || 'info',
      transports : [
        new Console({
          colorize  : true,
          formatter : log,
          timestamp : true,
        }),
      ],
    });
  }

  /**
   * Registers database
   *
   * @private
   *
   * @async
   */
  async _database() {
    // retister db
    const unlock = await this.lock('database.register');

    // initialize database
    try {
      // Connects to database
      const plug = new EdenModel.plugs[config.get('database.plug')](config.get('database.config'));

      // Log registering
      this.logger.log('info', 'Registering database', {
        class : 'Eden',
      });

      // Construct database with plug
      this.database = new EdenModel.Db(plug);

      // Loop models
      for (const key of Object.keys(models)) {
        // Set Model
        const Model = model(key);

        // Register Model
        await this.database.register(Model);

        // Await initialize
        await Model.initialize();
      }

      // Log registered
      this.logger.log('info', 'Registered database', {
        class : 'Eden',
      });
    } catch (e) { console.log(e); }

    // unlock db register
    unlock();
  }

  /**
   * Builds Daemons
   *
   * @private
   */
  _daemons() {
    // Check register
    if (!this.register('daemon')) this.register('daemon', {});

    // get cluster
    const clusterConfig = config.get('clusterMapping')[this.cluster];

    // get daemons
    const daemonClasses = daemons.filter((daemon) => {
      // return cluster
      return (clusterConfig ? clusterConfig.includes(daemon.file) : (!daemon.cluster || daemon.cluster.includes(this.cluster)));
    }).sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // loop toload
    for (const daemon of daemonClasses) {
      // Run daemon
      try {
        // Require Daemon
        const Daemon    = this.require(daemon.file);
        const callable  = endpoints.filter(e => e.file === daemon.file);
        const hookable  = hooks.filter(e => e.file === daemon.file);
        const eventable = events.filter(e => e.file === daemon.file);

        // Require daemon
        this.register('daemon')[daemon.file] = new Daemon();

        // do endpoints
        callable.forEach((endpoint) => {
          // do endpoint
          this.endpoint(endpoint.endpoint, this.register('daemon')[daemon.file][endpoint.fn], endpoint.all);
        });

        // do events
        eventable.forEach((e) => {
          // do endpoint
          this.on(e.event, this.register('daemon')[daemon.file][e.fn], e.all);
        });

        // do events
        hookable.forEach((hook) => {
          // do endpoint
          this[hook.type](hook.hook, this.register('daemon')[daemon.file][hook.fn]);
        });

        // Log running Daemon
        this.logger.log('info', `Running daemon ${daemon.file}`, {
          class : 'Eden',
        });
      } catch (e) {
        // Print error
        this.error(e);

        // Log Daemon failed to error
        this.logger.log('error', `Daemon ${daemon.file} failed!`, {
          class : 'Eden',
        });
      }
    }
  }
}

/**
 * Export new Eden instance
 *
 * @type {Eden}
 */
module.exports = new Eden();
