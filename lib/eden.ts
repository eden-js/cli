
// Require dependencies
import config from 'config';
import dotProp from 'dot-prop';
import winston from 'winston';
import EdenModel from '@edenjs/model';
import EventEmitter from 'events';
import { v4 as uuid } from 'uuid';

// Require local dependencies
import log from './log';

// import local
import pack from '../package.json';

/**
 * Create Eden class
 */
class Eden {
  /**
   * Construct Eden class
   */
  constructor() {
    // Bind private variables
    this.__data = {
      config  : global.config,
      version : pack.version,
    };

    // Bind cache methods
    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.del = this.del.bind(this);
    this.register = this.register.bind(this);

    // Bind public methods
    this.start = this.start.bind(this);

    // alt methods
    this.error = this.error.bind(this);
    this.ready = this.ready.bind(this);
    this.background = this.background.bind(this);

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

    // Bind private methods
    this.buildLogger = this.buildLogger.bind(this);
    this.buildDatabase = this.buildDatabase.bind(this);
  }


  // /////////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Get/Set Methods
  //
  // /////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * gets key/value
   *
   * @param key
   * @param remote
   */
  get(key, remote = false) {
    // get from dotprop
    if (remote) {
      // return get
      return this.get('register.pubsub').get(key);
    }

    // return get
    return dotProp.get(this.__data, key);
  }

  /**
   * sets value
   *
   * @param key
   * @param value
   * @param ttl
   */
  set(key, value, ttl = false) {
    // set
    dotProp.set(this.__data, key, value);

    // set value
    if (ttl) {
      // return get
      return this.get('register.pubsub').set(key, value, ttl === true ? (24 * 60 * 60 * 1000) : ttl);
    }
    
    // return value
    return this.get(key);
  }

  /**
   * deletes key
   *
   * @param key
   * @param remote
   */
  del(key, remote) {
    // set
    dotProp.delete(this.__data, key);

    // set in pubsub
    if (remote) {
      // return delete
      return this.get('register.pubsub').del(key);
    }
  }

  /**
   * register alias
   *
   * @param key
   * @param value
   */
  register(key, value) {
    // return value
    return value ? this.set(`register.${key}`, value) : this.get(`register.${key}`);
  }


  // /////////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Main Methods
  //
  // /////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Starts Eden framework
   */
  async start () {
    // Set variables
    this.id = config.get('id') || uuid();

    // Set process name
    try {
      // Set process name
      process.title = `${config.get('domain')} - ${config.get('cluster')} #${this.id}`;
    } catch (e) { /* */ }

    // add helpers
    this.events = new EventEmitter();
    this.logger = this.buildLogger();

    // set data
    this.__data.models = global.models;
    this.__data.helpers = global.helpers;
    this.__data.daemons = global.daemons;
    this.__data.controllers = global.controllers;

    // initialize daemons
    this.logger.log('info', 'initializing static functions');

    // initialize daemons then controllers
    for (const daemon of Object.keys(this.get('daemons') || {})) {
      // initialize
      if (this.get(`daemons.${daemon}.ctrl`).initialize) {
        // initialze daemon
        await this.get(`daemons.${daemon}.ctrl`).initialize(this);
      }
    }
    for (const controller of Object.keys(this.get('controllers') || {})) {
      // initialize
      if (this.get(`controllers.${controller}.ctrl`).initialize) {
        // initialze daemon
        await this.get(`controllers.${controller}.ctrl`).initialize(this);
      }
    }

    // initialize daemons
    this.logger.log('info', 'initialized static functions');

    // Connect database
    await this.buildDatabase();

    // add router
    if (!config.get('router.disable') && global.cluster !== 'back') {
      // initialize daemons
      this.logger.log('info', 'initializing controllers');

      // Require router
      const Router = require('./eden/router'); // eslint-disable-line global-require

      // Bind Eden classes
      this.router = new Router(this);

      // await router building
      await this.router.building;

      // initialize daemons
      this.logger.log('info', 'initialized controllers');
    }

    // initialize daemons
    this.logger.log('info', 'initializing daemons');

    // create daemons
    for (const daemon of Object.keys(this.get('daemons') || {})) {
      // initialize
      await this.init(this.get(`daemons.${daemon}`));
    }

    // initialize daemons
    this.logger.log('info', 'initialized daemons');

    // Add ping/pong logic
    this.on('eden.ping', () => {
      // Pong
      this.emit('eden.pong', `${config.get('cluster')}.${this.id}`, true);
    }, true);

    // Add thread specific listener
    this.on(`${config.get('cluster')}.${this.id}`, ({ type, args, callee }) => {
      // Emit data
      this.events.emit(type, ...args, {
        callee,
      });
    }, true);

    // Add thread specific listener
    this.on(`${config.get('cluster')}.all`, ({ type, args, callee }) => {
      // Emit data
      this.events.emit(type, ...args, {
        callee,
      });
    }, true);

    // Emit ready
    this.emit('eden.ready', true, false);
    this.emit(`eden.${config.get('cluster')}.${this.id}.ready`, true);
  }

  /**
   * initializes a controller
   *
   * @param ctrl 
   */
  async init(ctrl) {
    // check initialized
    if (this.get(`controller.${ctrl.data.file}`)) return this.get(`controller.${ctrl.data.file}`);

    // log
    this.logger.log('debug', 'initializing', {
      class : ctrl.data.file,
    });

    // created
    const created = new ctrl.ctrl();

    // create controller
    this.set(`controller.${ctrl.data.file}`, created);

    // loop events
    ctrl.events.forEach(({ event, fn, all }) => {
      // do endpoint
      this.on(event, created[fn], all);
    });
    // loop endpoints
    ctrl.endpoints.forEach(({ endpoint, fn, all }) => {
      // do endpoint
      this.endpoint(endpoint, created[fn], all);
    });
    // loop hooks
    ctrl.hooks.forEach(({ hook, type, fn, priority }) => {
      // do endpoint
      this[type](hook, created[fn], priority);
    });

    // log
    this.logger.log('debug', 'initialized', {
      class : ctrl.data.file,
    });

    // return created
    return created;
  }

  /**
   * thread
   *
   * @param {Object} data 
   */
  background(logic, data, e) {
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
    });
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
    throw e;
  }

  /**
   * Returns ready
   *
   * @return {*}
   */
  async ready() {
    // Return promise
    return await new Promise(async (resolve) => {
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
      this.get('register.pubsub').on(str, fn);
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
      this.get('register.pubsub').once(str, fn);
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
    return !all ? this.events.removeListener(str, fn) : this.get('register.pubsub').removeListener(str, fn);
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
          const promiseError = new Error(res.error.message);

          // set stack
          promiseError.stack = res.error.stack;

          // throw error
          reject(promiseError);
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
        return this.emit(id, {
          error   : e,
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
    return !all ? this.events.emit(str, ...args) : this.get('register.pubsub').emit(str, ...args);
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
          this.get('register.pubsub').emit(`${type}.${thread !== null ? thread : 'all'}`, {
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
          this.get('register.pubsub').emit(`${type}.${thread !== null ? thread : 'all'}`, {
            type   : str,
            args,
            callee : `${this.cluster}.${this.id}`,
          });
        });
      },
    };
  }


  // /////////////////////////////////////////////////////////////////////////////////////////////
  //
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
    return this.get('register.pubsub').lock(key, ttl);
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
    this.get('register.hook')[hook].pre.push({
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
    this.get('register.hook')[hook].post.push({
      fn,
      priority,
    });
  }

  /**
   * Adds hook
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
      if (fns.pre[a]) await fns.pre[a](...args, { hook, type : 'pre' });
    }

    // Exec actual function
    if (fn) await fn(...args);

    // Loop post-hook functions
    for (let b = 0; b < (fns.post || []).length; b += 1) {
      // Exec post-hook function
      if (fns.post[b]) await fns.post[b](...args, { hook, type : 'post' });
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
    if (!this.get('register.hook')) this.register('hook', {});

    // Check hook exists
    if (!this.get('register.hook')[hook]) {
      // add register hook
      this.get('register.hook')[hook] = {
        pre  : [],
        post : [],
      };
    }

    // keys
    const keys = Object.keys(this.get('register.hook')).filter((key) => {
      // exact match
      if (key === hook) return true;

      // check split
      const splitA = hook.split('.');
      const splitB = key.split('.');

      // split A/B
      if (key.includes('*') && splitA.length > 1 && splitB.length > 1 && splitA.length === splitB.length) {
        // check parts
        return !splitA.find((part, i) => // return match or star
        part !== splitB[i] && splitB[i] !== '*');
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
      const { pre, post } = this.get('register.hook')[key] || {};

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
   * Registers logger
   *
   * @return {Logger} logger
   *
   * @private
   */
  buildLogger() {
    // Set logger
    return winston.createLogger({
      level      : config.get('log.level') || 'info',
      transports : [
        new winston.transports.Console({
          format    : log,
          colorize  : true,
          timestamp : true,
        }),
      ],
    });
  }

  /**
   * builds database
   */
  async buildDatabase() {
    // retister db
    const unlock = await this.lock('database.register');

    // initialize database
    try {
      // Connects to database
      const Plug = require(config.get('database.plug'));
      const plug = new Plug(config.get('database.config'));

      // Log registering
      this.logger.log('info', 'Registering database', {
        class : 'Eden',
      });

      // Construct database with plug
      await EdenModel.init(plug);

      // Loop models
      for (const key of Object.keys(this.get('models'))) {
        // Set Model
        const Model = model(key);

        // Register Model
        await EdenModel.register(Model);

        // Await initialize
        await Model.initialize();
      }

      // Log registered
      this.logger.log('info', 'Registered database', {
        class : 'Eden',
      });
    } catch (e) { console.log(e); this.looger.log('error', e); }

    // unlock db register
    unlock();
  }
}

/**
 * Export new Eden instance
 *
 * @type {Eden}
 */
export default new Eden();