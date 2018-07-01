// Require dependencies
const util    = require('util');
const uuid    = require('uuid');
const redis   = require('redis');
const redisEE = require('redis-eventemitter');

// Require class dependencies
const Console      = require('winston').transports.Console;
const EdenModel    = require('edenjs-model');
const EventEmitter = require('events');
const Logger       = require('winston').Logger;
const RedisStore   = require('cacheman-redis');
const Redlock      = require('redlock');

// Require local dependencies
const log    = require('lib/utilities/log');
const config = require('config');

// Require cached resources
const models  = cache('models');
const daemons = cache('daemons');

// Build classes
const PrettyError = new (require('pretty-error'))();

// Build unhandled rejection error handler
process.on('unhandledRejection', (e) => {
  // Log error
  console.error(PrettyError.render(e));
});

// Build uncaught exception error handler
process.on('uncaughtException', (e) => {
  // Log error
  console.error(PrettyError.render(e));
});

/**
 * Create Eden class
 */
class Eden {

  /**
   * Construct Eden class
   */
  constructor () {
    // Bind private variables
    this._lock     = {};
    this._register = {};

    // Bind public methods
    this.start      = this.start.bind(this);
    this.error      = this.error.bind(this);
    this.ready      = this.ready.bind(this);
    this.require    = this.require.bind(this);
    this.register   = this.register.bind(this);
    this.controller = this.controller.bind(this);

    // Bind event methods
    this.on       = this.on.bind(this);
    this.off      = this.off.bind(this);
    this.emit     = this.emit.bind(this);
    this.once     = this.once.bind(this);
    this.call     = this.call.bind(this);
    this.endpoint = this.endpoint.bind(this);

    // Bind lock methods
    this.lock = this.lock.bind(this);

    // Bind hook methods
    this.pre  = this.pre.bind(this);
    this.post = this.post.bind(this);
    this.hook = this.hook.bind(this);

    // Bind cache methods
    this.get   = this.get.bind(this);
    this.set   = this.set.bind(this);
    this.del   = this.del.bind(this);
    this.cache = this.get.bind(this);
    this.clear = this.clear.bind(this);

    // Bind private methods
    this._port     = this._port.bind(this);
    this._locks    = this._locks.bind(this);
    this._caches   = this._caches.bind(this);
    this._events   = this._events.bind(this);
    this._logger   = this._logger.bind(this);
    this._daemons  = this._daemons.bind(this);
    this._database = this._database.bind(this);
  }


  // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Main Methods
  //
  // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Starts Eden framework
   *
   * This function is called from `/app.js` in every `compute` and `express` thread. The amount of threads are
   * specified in `/app/config.js` under `expressThreads` and `computeThreads`.
   *
   * @param {object} opts
   *
   * @async
   */
  async start (opts) {
    // Set variables
    this.id       = parseInt(opts.id);
    this.port     = opts.port || this._port();
    this.host     = opts.host || config.get('host') || '0.0.0.0';
    this.email    = false;
    this.pubsub   = false;
    this.events   = false;
    this.logger   = opts.logger || this._logger();
    this.express  = opts.express;
    this.compute  = !opts.express;
    this.database = false;

    // Bind events/lock methods
    this._locks();
    this._caches();
    this._events();

    // Clear all endpoints
    this.del('endpoint.*');

    // Connect database
    await this._database();

    // Require router
    const Router = require('./eden/router');

    // Bind Eden classes
    this.router = opts.express ? new Router() : false;

    // Build daemons
    await this._daemons();

    // Emit ready
    this.emit('eden.' + opts.id + '.ready', true);

    // Add ping/pong logic
    this.on('eden.ping', () => {
      // Pong
      this.emit('eden.pong', (opts.express ? 'express' : 'compute') + '.' + opts.id, true);
    }, true);
  }

  /**
   * Registers value to Eden
   *
   * Eden has an internal register system for registering core logic across the application. By default Eden uses this
   * to register the view engine, file transport engine, and database engine.
   *
   * Simply run `this.eden.register([name], [value])` within one of your Controllers or Daemons to create/overwrite a
   * current Eden register.
   *
   * This is not persistent cross thread. You will need to ensure you register your core Eden variables in every
   * possible Eden thread you intend to use them in.
   *
   * @param  {string} name
   * @param  {*}      value
   *
   * @return {*}
   */
  register (name, value) {
    // Check value
    if (typeof value === 'undefined') {
      // Return register
      return this._register[name];
    }

    // Set register value
    this._register[name] = value;

    // Return this
    return this;
  }

  /**
   * Requires file to register
   *
   * This just safely and gracefully requires a file. We use this to catch syntax and other errors when requiring
   * Controllers and/or Daemons. However this function can be used to require any file with
   * `this.eden.require ([file])`.
   *
   * @param  {string} file
   *
   * @return {Promise}
   */
  require (file) {
    // Log which file to require to debug
    this.logger.log('debug', 'Requiring ' + file, {
      'class' : 'Eden'
    });

    // Try catch
    try {
      // Return required file
      return require(file);
    } catch (e) {
      // Print error
      this.error(e);

      // Exit process
      process.exit();
    }
  }

  /**
   * Get controller
   *
   * This function is the core module loader for Eden. All Eden Controllers and Daemons should be required and
   * initialized with this method as to prevent them loading multiple times, and to ensure they exist within the Eden
   * Controller register.
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
  async controller (file) {
    // Check register
    if (!this.register('controller')) this.register('controller', {});

    // Try catch
    try {
      // Find in register and check if Controller registered
      if (!this.register('controller')[file]) {
        // Require Controller class
        const Controller = await this.require(file);

        // Register Controller instance
        this.register('controller')[file] = new Controller();
      }

      // Return registered Controller instance
      return this.register('controller')[file];
    } catch (e) {
      // Print error
      this.error(e);

      // Exit process
      process.exit();
    }
  }

  /**
   * Pretty prints error
   *
   * By default Eden core passes errors through pretty print
   *
   * @param {Error} e
   */
  error (e) {
    // Log error
    console.error(PrettyError.render(e));

    // Emit error
    this.emit('Eden.error', e);
  }

  /**
   * Returns ready
   *
   * @return {*}
   */
  ready () {
    // Return promise
    return new Promise(async (resolve) => {
      // Set ids
      const ids = new Map();

      // Set total and ready
      let total = config.get('expressThreads') + config.get('computeThreads');
      let ready = false;

      // Create catch
      let catchPong = (id) => {
        // Check map has id
        if (ids.has(id)) return;

        // Add to ids
        ids.set(id, true);

        // Remove from total
        total--;

        // Check total
        if (total <= 0) {
          // Set ready
          ready = true;

          // Resolve true
          resolve(true);
        }
      };

      // On pong
      this.on('eden.pong', catchPong, true);

      // Emit ping
      this.emit('eden.ping', new Date(), true);

      // Wait 500ms
      await new Promise((res) => {
        // Resolve in 500 ms
        setTimeout(res, 500);
      });

      // Remove pong listener
      this.off('eden.pong', catchPong, true);

      // Check ready
      if (!ready) return await this.ready();
    });
  }


  // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Event Methods
  //
  // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * on function
   *
   * `this.eden` also acts as a cross-thread event emitter. Using redis you can emit and receive Eden events using:
   *
   * `this.eden.on ([event name], [callback], [all threads?])`
   *
   * For example if we wanted to listen to the event `example` on every thread we would do:
   *
   * `this.eden.on ('example', (...args) => {
   *   // Log args
   *   console.info (...args);
   * }, true);`
   *
   * While if we only want to listen to this event on the current thread, we would do:
   *
   * `this.eden.on ('example', (...args) => {
   *   // Log args
   *   console.info (...args);
   * });`
   *
   * @param {string}   str
   * @param {function} fn
   * @param {boolean}  all
   */
  on (str, fn, all) {
    // On str/fn
    if (all) {
      // Pubsub on
      this.pubsub.on(str, (channel, ...args) => {
        // Run function
        fn(...args);
      });
    } else {
      // Add event listener
      this.events.on(str, fn);
    }
  }

  /**
   * On function
   *
   * `this.eden.once ([event name], [callback], [all threads?])`
   *
   * For example if we wanted to listen to one event `example` on every thread we would do:
   *
   * `this.eden.once ('example', (...args) => {
   *   // Log args
   *   console.info (...args);
   * }, true);`
   *
   * While if we only want to listen to this event once the current thread, we would do:
   *
   * `this.eden.once ('example', (...args) => {
   *   // Log args
   *   console.info (...args);
   * });`
   *
   * @param {string}   str
   * @param {function} fn
   * @param {boolean}  all
   */
  once (str, fn, all) {
    // On str/fn
    if (all) {
      // Pubsub on
      this.pubsub.once(str, (channel, data) => {
        // Run function
        fn(data);
      });
    } else {
      // Add event listener
      this.events.once(str, fn);
    }
  }

  /**
   * Remove event listener function
   *
   * This method removes an event listener from either all or the current thread to do this simply run:
   *
   * `this.eden.off ([event name], [callback], [all threads?])`
   *
   * @param {string}   str
   * @param {function} fn
   * @param {boolean}  all
   *
   * @return {*}
   */
  off (str, fn, all) {
    // Remove listener
    return this[all ? 'pubsub' : 'events'][(fn ? 'removeListener' : 'removeAllListeners')](str, fn);
  }

  /**
   * Call endpoint cross threads
   *
   * This method allows you to call an endpoint in another thread. Usually used for inter-daemon communication
   * (Daemons running on different threads).
   *
   * To call a method we need to ensure that the endpoint we expect has been registered in the other thread using:
   *
   * `this.eden.endpoint ([endpoint name], [endpoint function])`
   *
   * When we call an endpoint, we expect the above to return an async response, we do this by doing:
   *
   * `const response = await this.eden.call ([endpoint name], [...args])`
   *
   * @param  {string} str
   * @param  {array}  args
   *
   * @return {Promise}
   */
  call (str, ...args) {
    // Set all
    const all = typeof args[args.length - 1] === 'boolean' ? args[args.length - 1] : false;

    // Set id
    const id = uuid();

    // Create emission
    const emission = {
      'id'   : id,
      'str'  : str,
      'args' : args
    };

    // Emit to socket
    this.emit('connect.call.' + str, emission, all);

    // Await one response
    return new Promise((resolve) => {
      // On message
      this.once(id, resolve, all);
    });
  }

  /**
   * Receive call cross threads
   *
   * This method allows you to register an endpoint in any thread. Usually used for inter-daemon communication
   * (Daemons running on different threads).
   *
   * to register a method we need to do the following:
   *
   * `this.eden.endpoint ([endpoint name], [endpoint function])`
   *
   * @param  {string}   str
   * @param  {function} fn
   * @param  {boolean}  all
   */
  endpoint (str, fn, all) {
    // On connect call
    this.on('connect.call.' + str, async ({ id, args }) => {
      // Run function
      this.emit(id, await fn(...args), all);
    }, all);
  }

  /**
   * Emit event
   *
   * this method emits an event to all or the current thread. To use this simply:
   *
   * `this.eden.emit ([event name], [..arguments], [all threads?])`
   *
   * @param  {string}  str
   * @param  {array}   args
   *
   * @return {*}
   */
  emit (str, ...args) {
    // Set all
    let all = typeof args[args.length - 1] === 'boolean' ? args[args.length - 1] : false;

    // Emit function
    return this[all ? 'pubsub' : 'events'].emit.apply(this[all ? 'pubsub' : 'events'], [str, ...args]);
  }

  /**
   * Emit to specific thread
   *
   * This method emits an event to a specific thread. To use this simply:
   *
   * `this.eden.thread ('compute', 0, [event name], [..arguments])`
   *
   * @param {string} type
   * @param {string} id
   * @param {string} str
   * @param {array}  args
   *
   * @return {*}
   */
  thread (type, id, str, ...args) {
    // Emit function
    return this.pubsub.emit(type + ':' + id, {
      'type'   : str,
      'args'   : args,
      'callee' : (this.express ? 'express' : 'compute') + ':' + this.id
    });
  }


  // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Lock Methods
  //
  // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Returns unlock function
   *
   * Core Eden clusters threads, this means we need to ensure we can stop other logic running where we already have
   * logic running. For example checking a user's balance.
   *
   * To lock a function and ensure other threads need to wait to do their own logic on that function simply do the
   * following:
   *
   * `const unlock = await this.eden.lock ([lock name], [ttl ms])`
   *
   * Once you have finished with the logic you are running, and want to let other threads have a go, simply run
   * `unlock ()`
   *
   * @param  {string} key
   * @param  {number} ttl
   *
   * @return {Promise}
   *
   * @async
   */
  async lock (key, ttl) {
    // Check all/ttl
    if (ttl === true || !ttl) {
      // Set default ttl
      ttl = 60 * 60 * 1000;
    }

    // Create lock
    const redisLock = await this._lock.redis.lock(key, ttl);

    // Return complete function
    return redisLock.unlock.bind(redisLock);
  }

  // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Cache Methods
  //
  // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Fets (and sets) cache by key
   *
   * This method gets and returns a sanitisable object from redis. It also allows you to specify a default cache value.
   * To get a value simply:
   *
   * `const value = await this.eden.get ([key])`
   *
   * To get a value, or a default returned value simply:
   *
   * `const value = await this.eden.get ([key], () => {
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
  async get (key, notCached, ttl) {
    // Check cached
    if (typeof notCached === 'number') {
      // No callback required
      ttl       = notCached;
      notCached = null;
    }

    // Promisify get
    const get = util.promisify(this.register('cache').get.bind(this.register('cache')));

    // Get value
    let value = await get(key);

    // Check key
    if (value === null && notCached) {
      // Set cached
      value = await notCached();

      // Set
      ttl ? await this.set(key, value, ttl) : await this.set(key, value);
    }

    // Check value
    if (value && typeof value === 'object' && value.id && value.model) {
      // Load model
      value = model(value.model).findById(value.id);
    }

    // Return cached value
    return value;
  }

  /**
   * Sets cache by key
   *
   * This method allows you to set a sanitisable value in redis for use cross-thread. This is used by Eden core to
   * cache pages when you use the `@cache` annotation specifying a route
   *
   * To set a value to Eden cache simply:
   *
   * `await this.eden.set ([key], {
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
  async set (key, value, ttl = 0) {
    // Promisify set
    const set = util.promisify(this.register('cache').set.bind(this.register('cache')));

    // Create original value
    const original = value;

    // Check value
    if (value instanceof require('model') && value.get('_id')) {
      // Set value
      value = {
        'id'    : value.get('_id').toString(),
        'model' : value.constructor.name
      };
    }

    // Await set
    ttl ? await set(key, value, ttl) : await set(key, value);

    // Return original value
    return original;
  }

  /**
   * Delete cache by key
   *
   * This method allows you to remove an existing cache by key from redis. To do this simply:
   *
   * `await this.eden.del ([key])`
   *
   * @param   {string} key
   *
   * @returns {Promise}
   */
  del (key) {
    // Promisify del
    const del = util.promisify(this.register('cache').del.bind(this.register('cache')));

    // Await del
    return del(key);
  }

  /**
   * Delete cache
   *
   * This method clears the _entire_ Eden lock and cache, please be careful with this method as it applies
   * cross-thread; though only to the current application
   *
   * @async
   */
  async clear () {
    // Promisify clear
    const clear = util.promisify(this.register('cache').clear.bind(this.register('cache')));

    // Await get
    await clear();

    // Set promise
    const keys = await new Promise((resolve, reject) => {
      // Return locks
      this._lock.client.keys(config.get('domain') + '.lock.*', (err, keys) => {
        // Check error
        if (err !== null) {
          // Reject
          reject(err);
        } else {
          // Resolve
          resolve(keys);
        }
      });
    });

    // Loop keys
    for (const key of keys) {
      // Set promise
      await new Promise((resolve, reject) => {
        // Delete key
        this._lock.client.del(key.slice((config.get('domain') + '.lock.').length), (err, res) => {
          // Check error
          if (err !== null) {
            // Reject
            reject(err);
          } else {
            // Resolve
            resolve(res);
          }
        });
      });
    }
  }


  // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Hook Methods
  //
  // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Adds hook pre event
   *
   * Eden has an internal hook system, though it is only able to hook within the thread that the hook is used
   * (hooks are not cross-thread). This is because the expected hook data is not required to be sanitisable.
   *
   * To add a function to run before a hooked function, do the following:
   *
   * `this.eden.pre ([hook name], [function to run])`
   *
   * @param {string}   hook
   * @param {function} fn
   */
  pre (hook, fn) {
    // Push pre-hook function
    this.__hook(hook).pre.push(fn);
  }

  /**
   * Add post hook to act as pre
   *
   * To add a function to run after a hooked function, do the following:
   *
   * `this.eden.post ([hook name], [function to run])`
   *
   * @param {string}   hook
   * @param {function} fn
   */
  post (hook, fn) {
    // Push post-hook function
    this.__hook(hook).post.push(fn);
  }


  /**
   * Adds kareem hook
   *
   * This method runs an Eden hook, this simply allows us to execute cross-bundle functionality on an event. This is
   * used extensively within the core view logic.
   *
   * To await a hook simply:
   *
   * `const data = {
   *   'hello' : 'world'
   * };
   *
   * // Await hooks to run
   * await this.eden.hook ('example', data, (data) => {
   *   // All pre-hooks have run at this point
   *   data.hello = 'goodbye';
   * });
   *
   * // All post hooks have run at this point
   * console.info (data);`
   *
   * @param {string} hook
   * @param {array}  args
   *
   * @async
   */
  async hook (hook, ...args) {
    // Set fn
    let fn = false;

    // Get function
    if (args.length > 1 && args[args.length - 1] instanceof Function && typeof args[args.length - 1] === 'function' && args[args.length - 1].call) fn = args.splice(-1)[0];

    // Check hook
    const fns = this.__hook(hook);

    // Loop pre-hook functions
    for (let a = 0; a < (fns.pre || []).length; a++) {
      // Exec pre-hook function
      await fns.pre[a](...args);
    }

    // Exec actual function
    if (fn) await fn(...args);

    // Loop post-hook functions
    for (let b = 0; b < (fns.post || []).length; b++) {
      // Exec post-hook function
      await fns.post[b](...args);
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
  __hook (hook) {
    // Check register
    if (!this.register('hook')) this.register('hook', {});

    // Check hook exists
    if (!this.register('hook')[hook]) this.register('hook')[hook] = {
      'pre'  : [],
      'post' : []
    };

    // Return register
    return this.register('hook')[hook];
  }


  // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Private Methods
  //
  // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Registers port
   *
   * @returns {string}
   *
   * @private
   */
  _port () {
    // Check if express
    if (!this.express) return;

    // Set port from config
    this.port = config.get('port');

    // Log using port
    this.logger.log('info', 'Using express on port ' + this.port, {
      'class' : 'Eden'
    });

    // Return port
    return this.port;
  }

  /**
   * Registers logger
   *
   * @return {Logger} logger
   *
   * @private
   */
  _logger () {
    // Set logger
    return new Logger({
      'level'      : config.get('logLevel') || 'info',
      'transports' : [
        new Console({
          'colorize'  : true,
          'formatter' : log,
          'timestamp' : true
        })
      ]
    });
  }

  /**
   * Registers Eden event emitter
   *
   * @private
   */
  _locks () {
    // Get connection
    const conn = config.get('redis');

    // Set prefix
    conn.prefix = config.get('domain') + '.lock.';

    // Create events redis instance
    const client = redis.createClient(conn);

    // Set lock
    this._lock = {
      'redis'  : new Redlock([client], {
        'retryCount' : -1
      }),
      'client' : client
    };
  }

  /**
   * Create cache
   */
  _caches () {
    // Create cache
    this.register('cache', new RedisStore(config.get('redis')));
  }

  /**
   * Registers Eden event emitter
   *
   * @private
   */
  _events () {
    // Get connection
    const conn = config.get('redis');

    // Set prefix
    conn.prefix = config.get('domain') + '.event';

    // Create events redis instance
    this.pubsub = redisEE(conn);

    // Create new events class
    this.events = new EventEmitter();

    // On specific thread event
    this.pubsub.on((this.express ? 'express' : 'compute') + ':' + this.id, (channel, data) => {
      // Emit to this
      this.emit(data.type, ...data.args, {
        'callee' : data.callee
      });
    });
  }

  /**
   * Registers database
   *
   * @private
   *
   * @async
   */
  async _database () {
    // Connects to database
    const lock = await this.lock('database.register', true);
    const plug = new EdenModel.plugs[config.get('database.plug')](config.get('database.config'));

    // Log registering
    this.logger.log('info', 'Registering database', {
      'class' : 'Eden'
    });

    // Construct database with plug
    this.database = new EdenModel.Db(plug);

    // Loop models
    for (const key in models) {
      // Check models has key
      if (models.hasOwnProperty(key)) {
        // Set Model
        const Model = model(key);

        // Register Model
        await this.database.register(Model);

        // Await initialize
        await Model.initialize();
      }
    }

    // Log registered
    this.logger.log('info', 'Registered database', {
      'class' : 'Eden'
    });

    // Unlock
    lock();
  }

  /**
   * Builds Daemons
   *
   * @private
   */
  _daemons () {
    // Check register
    if (!this.register('daemon')) this.register('daemon', {});

    // Loop daemons
    for (let file in daemons) {
      // Check if daemons has file
      if (daemons.hasOwnProperty(file)) {
        // Check if should require
        if (!daemons[file].compute && this.compute) continue;
        if (!daemons[file].express && this.express) continue;

        // Check correct thread
        if (this.compute && daemons[file].compute !== true && !daemons[file].compute.includes(this.id)) continue;
        if (this.express && daemons[file].express !== true && !daemons[file].express.includes(this.id)) continue;

        // Run daemon
        try {
          // Require Daemon
          const Daemon = this.require(file);

          // Require daemon
          this.register('daemon')[file] = new Daemon();

          // Log running Daemon
          this.logger.log('info', 'Running daemon ' + daemons[file].name, {
            'class' : 'Eden'
          });
        } catch (e) {
          // Print error
          this.error(e);

          // Log Daemon failed to error
          this.logger.log('error', 'Daemon ' + daemons[file].name + ' failed!', {
            'class' : 'Eden'
          });
        }
      }
    }
  }

}

/**
 * Export new Eden instance
 *
 * @type {Eden}
 */
exports = module.exports = new Eden();
