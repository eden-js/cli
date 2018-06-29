
// require dependencies
const util      = require ('util');
const uuid      = require ('uuid');
const redis     = require ('redis');
const events    = require ('events');
const winston   = require ('winston');
const redlock   = require ('redlock');
const redisEE   = require ('redis-eventemitter');
const cacheman  = require ('cacheman-redis');
const edenModel = require ('edenjs-model');

// require local dependencies
const log    = require ('lib/utilities/log');
const config = require ('config');

// require cached resources
const models  = cache ('models');
const daemons = cache ('daemons');

// build classes
let error = require ('pretty-error');

// set error
error = new error ();

// build error handler
process.on ('unhandledRejection', (e) => {
  // log error
  console.log (error.render (e));
});
process.on ('uncaughtException', (e) => {
  // log error
  console.log (error.render (e));
});

/**
 * build eden class
 */
class eden {

  /**
   * construct eden class
   */
  constructor () {
    // bind private variables
    this._lock     = {};
    this._register = {};

    // bind methods
    this.start      = this.start.bind (this);
    this.error      = this.error.bind (this);
    this.ready      = this.ready.bind (this);
    this.require    = this.require.bind (this);
    this.register   = this.register.bind (this);
    this.controller = this.controller.bind (this);

    // bind event methods
    this.on       = this.on.bind (this);
    this.off      = this.off.bind (this);
    this.emit     = this.emit.bind (this);
    this.once     = this.once.bind (this);
    this.call     = this.call.bind (this);
    this.endpoint = this.endpoint.bind (this);

    // bind lock methods
    this.lock = this.lock.bind (this);

    // bind hook methods
    this.pre  = this.pre.bind (this);
    this.post = this.post.bind (this);
    this.hook = this.hook.bind (this);

    // bind cache methods
    this.get   = this.get.bind (this);
    this.set   = this.set.bind (this);
    this.del   = this.del.bind (this);
    this.cache = this.get.bind (this);
    this.clear = this.clear.bind (this);

    // bind private methods
    this._port     = this._port.bind (this);
    this._locks    = this._locks.bind (this);
    this._caches   = this._caches.bind (this);
    this._events   = this._events.bind (this);
    this._logger   = this._logger.bind (this);
    this._daemons  = this._daemons.bind (this);
    this._database = this._database.bind (this);
  }


  ////////////////////////////////////////////////////////////////////////////
  //
  //  Main Methods
  //
  ////////////////////////////////////////////////////////////////////////////

  /**
   * starts eden framework
   *
   * this function is called from `/app.js` in every `compute` and `express`
   * thread. the amount of threads are specified in `/app/config.js` under
   * `expressThreads` and `computeThreads`.
   *
   * @param {Object} opts
   */
  async start (opts) {
    // set variables
    this.id       = parseInt (opts.id);
    this.port     = opts.port || this._port ();
    this.host     = opts.host || config.get ('host') || '0.0.0.0';
    this.email    = false;
    this.pubsub   = false;
    this.events   = false;
    this.logger   = opts.logger || this._logger ();
    this.express  = opts.express;
    this.compute  = !opts.express;
    this.database = false;

    // bind events/lock methods
    this._locks ();
    this._caches ();
    this._events ();

    // clear all endpoints
    this.del ('endpoint.*');

    // connect database
    await this._database ();

    // require router
    let router = require ('./eden/router');

    // bind eden classes
    this.router = opts.express ? new router () : false;

    // build daemons
    await this._daemons ();

    // emit ready
    this.emit ('eden.' + opts.id + '.ready', true);

    // add ping/pong logic
    this.on ('eden.ping', () => {
      // pong
      this.emit ('eden.pong', (opts.express ? 'express' : 'compute') + '.' + opts.id, true);
    }, true);
  }

  /**
   * registers value to eden
   *
   * eden has an internal register system for registering core logic across the
   * appliction. By default eden uses this to register the view engine, file
   * transport engine, and database engine.
   *
   * simply run `this.eden.register([name], [value])` within one of your
   * daemons or controllers to create/overwrite a current eden register.
   *
   * this is not persistent cross thread. You will need to ensure you register
   * your core eden variables in every possible eden thread you intend to use
   * them in.
   *
   * @param  {String} name
   * @param  {*}      value
   *
   * @return {*}
   */
  register (name, value) {
    // check register
    if (typeof value === 'undefined') {
      // return register
      return this._register[name];
    }

    // set value
    this._register[name] = value;

    // return this
    return this;
  }

  /**
   * requires file to register
   *
   * this just safely and gracefully requires a file. We use this to catch
   * syntax and other errors when requiring controllers and daemons. However
   * this function can be used to require any file with
   * `this.eden.require ([file])`.
   *
   * @param  {String}   file
   * @param  {Boolean}  doNew
   *
   * @return {Promise}
   */
  require (file) {
    // log which file to require
    this.logger.log ('debug', 'requiring ' + file, {
      'class' : 'eden'
    });

    // try catch
    try {
      // try require
      let req = require (file);

      // resolve
      return req;
    } catch (e) {
      // print error
      this.error (e);

      // exit process
      process.exit ();
    }
  }

  /**
   * get controller
   *
   * this function is the core module loader for eden. All eden daemons and
   * controllers should be required and initialized with this method as to
   * prevent them loading multiple times, and to ensure they exist within the
   * eden controller register.
   *
   * to use this method to call a controller cross-bundle use:
   *
   * `this.eden.controller('app/bundles/[bundle]/controllers/[controller].js')`
   *
   * @param  {String} file
   *
   * @return {*}
   */
  async controller (file) {
    // check register
    if (!this.register ('controller')) this.register ('controller', {});

    // try catch
    try {
      // find in register
      // check if controller registered
      if (!this.register ('controller')[file]) {
        // require controller
        let ctrl = await this.require (file);

        // register controller
        this.register ('controller')[file] = new ctrl ();
      }

      // resolve
      return this.register ('controller')[file];
    } catch (e) {
      // print error
      this.error (e);

      // exit process
      process.exit ();
    }
  }

  /**
   * pretty prints error
   *
   * by default eden core passes errors through pretty print
   *
   * @param  {Error} e
   */
  error (e) {
    // log error
    console.log (error.render (e));

    // emit error
    this.emit ('eden.error', e);
  }

  /**
   * returns ready
   *
   * @return {*}
   */
  ready () {
    // return promise
    return new Promise (async (resolve) => {
      // get total
      let ids   = new Map ();
      let total = config.get ('expressThreads') + config.get ('computeThreads');
      let ready = false;

      // create catch
      let catchPong = (id) => {
        // check map has id
        if (ids.has (id)) return;

        // add to ids
        ids.set (id, true);

        // remove from total
        total--;

        // check total
        if (total <= 0) {
          // set ready
          ready = true;

          // resolve true
          resolve (true);
        }
      };

      // on pong
      this.on ('eden.pong', catchPong, true);

      // emit ping
      this.emit ('eden.ping', new Date (), true);

      // wait 500ms
      await new Promise ((res) => {
        // resolve in 500 ms
        setTimeout (res, 500);
      });

      // remove pong listener
      this.off ('eden.pong', catchPong, true);

      // check ready
      if (!ready) return await this.ready ();
    });
  }


  //////////////////////////////////////////////////////////////////////////////
  //
  //  Event Methods
  //
  //////////////////////////////////////////////////////////////////////////////

  /**
   * on function
   *
   * `this.eden` also acts as a cross-thread event emitter. Using redis you can
   * emit and receive eden events using:
   *
   * `this.eden.on ([event name], [callback], [all threads?])`
   *
   * for example if we wanted to listen to the event `example` on every thread
   * we would do:
   *
   * `this.eden.on ('example', (...args) => {
   *   // log args
   *   console.log (...args);
   * }, true);`
   *
   * while if we only want to listen to this event on the current thread, we
   * would do:
   *
   * `this.eden.on ('example', (...args) => {
   *   // log args
   *   console.log (...args);
   * });`
   *
   * @param  {String}   str
   * @param  {Function} fn
   * @param  {Boolean}  all
   */
  on (str, fn, all) {
    // on str/fn
    if (all) {
      // pubsub on
      this.pubsub.on (str, (channel, ...args) => {
        // run function
        fn (...args);
      });
    } else {
      // add event listener
      this.events.on (str, fn);
    }
  }

  /**
   * on function
   *
   * `this.eden.once ([event name], [callback], [all threads?])`
   *
   * for example if we wanted to listen to one event `example` on every thread
   * we would do:
   *
   * `this.eden.once ('example', (...args) => {
   *   // log args
   *   console.log (...args);
   * }, true);`
   *
   * while if we only want to listen to this event once the current thread, we
   * would do:
   *
   * `this.eden.once ('example', (...args) => {
   *   // log args
   *   console.log (...args);
   * });`
   *
   * @param  {String}   str
   * @param  {Function} fn
   * @param  {Boolean}  all
   */
  once (str, fn, all) {
    // on str/fn
    if (all) {
      // pubsub on
      this.pubsub.once (str, (channel, data) => {
        // run function
        fn (data);
      });
    } else {
      // add event listener
      this.events.once (str, fn);
    }
  }

  /**
   * remove event listener function
   *
   * this method removes an event listener from either all or the current thread
   * to do this simply run:
   *
   * `this.eden.off ([event name], [callback], [all threads?])`
   *
   * @param  {String}   str
   * @param  {Function} fn
   * @param  {Boolean}  all
   *
   * @return {*}
   */
  off (str, fn, all) {
    // remove listener
    return this[all ? 'pubsub' : 'events'][(fn ? 'removeListener' : 'removeAllListeners')] (str, fn);
  }

  /**
   * call endpoint cross threads
   *
   * this method allows you to call an endpoint in another thread. usually used
   * for inter-daemon communication (daemons running on different threads).
   *
   * to call a method we need to ensure that the endpoint we expect has been
   * registered in the other thread using:
   *
   * `this.eden.endpoint ([endpoint name], [endpoint function])`
   *
   * when we call an endpoint, we expect the above to return an async response,
   * we do this by doing:
   *
   * `let response = await this.eden.call ([endpoint name], [...args])`
   *
   * @param  {String}  str
   * @param  {Array}   args
   *
   * @return {Promise}
   */
  call (str, ...args) {
    // let all
    let all = typeof args[args.length - 1] === 'boolean' ? args[args.length - 1] : false;

    // let id
    let id = uuid ();

    // create emission
    let emission = {
      'id'   : id,
      'str'  : str,
      'args' : args
    };

    // emit to socket
    this.emit ('connect.call.' + str, emission, all);

    // await one response
    return new Promise ((resolve) => {
      // on message
      this.once (id, resolve, all);
    });
  }

  /**
   * receive call cross threads
   *
   * this method allows you to register an endpoint in any thread. usually used
   * for inter-daemon communication (daemons running on different threads).
   *
   * to register a method we need to do the following:
   *
   * `this.eden.endpoint ([endpoint name], [endpoint function])`
   *
   * @param  {String}   str
   * @param  {Function} fn
   * @param  {Boolean}  all
   */
  endpoint (str, fn, all) {
    // on connect call
    this.on ('connect.call.' + str, async ({ id, args }) => {
      // run function
      this.emit (id, await fn (...args), all);
    }, all);
  }

  /**
   * emit event
   *
   * this method emits an event to all or the current thread. to use this
   * simply:
   *
   * `this.eden.emit ([event name], [..arguments], [all threads?])`
   *
   * @param  {String}  str
   * @param  {Array}   args
   *
   * @return {*}
   */
  emit (str, ...args) {
    // let all
    let all = typeof args[args.length - 1] === 'boolean' ? args[args.length - 1] : false;

    // emit function
    return this[all ? 'pubsub' : 'events'].emit.apply (this[all ? 'pubsub' : 'events'], [str, ...args]);
  }

  /**
   * emit to specific thread
   *
   * this method emits an event to a specific thread. to use this
   * simply:
   *
   * `this.eden.thread ('compute', 0, [event name], [..arguments])`
   *
   * @param {String} type
   * @param {String} id
   * @param {String} str
   * @param {Object} obj
   *
   * @return {*}
   */
  thread (type, id, str, obj) {
    // emit function
    return this.pubsub.emit (type + ':' + id, {
      'type' : str,
      'data' : obj
    });
  }


  //////////////////////////////////////////////////////////////////////////////
  //
  //  Lock Methods
  //
  //////////////////////////////////////////////////////////////////////////////

  /**
   * returns unlock function
   *
   * core eden clusters threads, this means we need to ensure we can stop other
   * logic running where we already have logic running. for example checking a
   * users balance.
   *
   * to lock a function and ensure other threads need to wait to do their own
   * logic on that function simply do the following:
   *
   * `let unlock = await this.eden.lock ([lock name], [ttl ms])`
   *
   * once you have finished with the logic you are running, and want to let
   * other threads have a go, simply run `unlock ()`
   *
   * @param  {String}  key
   * @param  {Integer} ttl
   *
   * @return {Promise}
   */
  async lock (key, ttl) {
    // check all/ttl
    if (ttl === true || !ttl) {
      // add ttl
      ttl = 60 * 60 * 1000;
    }

    // create lock
    let redisLock = await this._lock.redis.lock (key, ttl);

    // return complete function
    return redisLock.unlock.bind (redisLock);
  }

  //////////////////////////////////////////////////////////////////////////////
  //
  //  Cache Methods
  //
  //////////////////////////////////////////////////////////////////////////////

  /**
   * gets (and sets) cache by key
   *
   * this method gets and returns a sanitisable object from redis. it also
   * allows you to specify a default cache value. To get a value simply:
   *
   * `let value = await this.eden.get ([key])`
   *
   * to get a value, or a default returned value simply:
   *
   * `let value = await this.eden.get ([key], () => {
   *   // return new value to cache for 60 seconds
   *   return {
   *     'cached' : true
   *   };
   * }, 60 * 1000)`
   *
   * @param  {String}   key
   * @param  {Function} notCached
   * @param  {Integer}  ttl
   *
   * @return {*}
   */
  async get (key, notCached, ttl) {
    // check cached
    if (typeof notCached === 'number') {
      // no callback required
      ttl       = notCached;
      notCached = null;
    }

    // promisify get
    let get = util.promisify (this.register ('cache').get.bind (this.register ('cache')));

    // get value
    let value = await get (key);

    // check key
    if (value === null && notCached) {
      // set cached
      value = await notCached ();

      // set
      ttl ? await this.set (key, value, ttl) : await this.set (key, value);
    }

    // check value
    if (value && typeof value === 'object' && value.id && value.model) {
      // load type
      value = model (value.model).findById (value.id);
    }

    // return cached
    return value;
  }

  /**
   * sets cache by key
   *
   * this method allows you to set a sanitisable value in redis for use cross
   * thread. this is used by eden core to cache pages when you use the `@cache`
   * parameter specifying a route
   *
   * to set a value to eden cache simply:
   *
   * `await this.eden.set ([key], {
   *    'cached' : true
 *    }, 60 * 1000)`
   *
   * @param  {String} key
   * @param  {*} value
   * @param  {Integer} ttl
   *
   * @return {*}
   */
  async set (key, value, ttl) {
    // promisify get
    let set = util.promisify (this.register ('cache').set.bind (this.register ('cache')));

    // create original value
    let original = value;

    // check value
    if (value instanceof require ('model') && value.get ('_id')) {
      // set value
      value = {
        'id'    : value.get ('_id').toString (),
        'model' : value.constructor.name
      };
    }

    // await get
    ttl ? await set (key, value, ttl) : await set (key, value);

    // return value
    return original;
  }

  /**
   * delete cache by key
   *
   * this method allows you to remove an existing cache by key from redis. to do
   * this simply:
   *
   * `await this.eden.del ([key])`
   *
   * @param {String} key
   *
   * @returns {Promise}
   */
  del (key) {
    // promisify get
    let del = util.promisify (this.register ('cache').del.bind (this.register ('cache')));

    // await get
    return del (key);
  }

  /**
   * delete cache
   *
   * this method clears the _entire_ eden lock and cache, please be careful
   * with this method as it applies cross thread; though only to the current
   * application
   */
  async clear () {
    // promisify get
    let clear = util.promisify (this.register ('cache').clear.bind (this.register ('cache')));

    // await get
    await clear ();

    // clear locks
    let keys = await new Promise ((resolve, reject) => {
      // set promise
      this._lock.client.keys (config.get ('domain') + '.lock.*', (err, keys) => {
        if (err != null) { reject (err); } else { resolve (keys); }
      });
    });

    // delete key
    for (let key of keys) {
      // delete key
      await new Promise ((resolve, reject) => {
        // set promise
        this._lock.client.del (key.slice ((config.get ('domain') + '.lock.').length), (err, res) => {
          if (err != null) { reject (err); } else { resolve (res); }
        });
      });
    }
  }


  //////////////////////////////////////////////////////////////////////////////
  //
  //  Hook Methods
  //
  //////////////////////////////////////////////////////////////////////////////

  /**
   * adds hook pre event
   *
   * eden has an internal hook system, though it is only able to hook within the
   * thread that the hook is used (hooks are not cross thread). This is because
   * the expected hook data is not required to be sanitisable.
   *
   * To add a function to run before a hooked function, do the following:
   *
   * `this.eden.pre ([hook name], [function to run])`
   *
   * @param {String} hook
   * @param {Function} fn
   */
  pre (hook, fn) {
    // check hook
    this.__hook (hook).pre.push (fn);
  }

  /**
   * add post hook to act as pre
   *
   * To add a function to run after a hooked function, do the following:
   *
   * `this.eden.post ([hook name], [function to run])`
   *
   * @param {String} hook
   * @param {Function} fn
   */
  post (hook, fn) {
    // check hook
    this.__hook (hook).post.push (fn);
  }


  /**
   * adds kareem hook
   *
   * this method runs an eden hook, this simply allows us to execte cross-bundle
   * functionality on an event. This is used extensively within the core view
   * logic.
   *
   * to await a hook simply:
   *
   * `let data = {
   *   'hello' : 'world'
   * };
   *
   * // await hooks to run
   * await this.eden.hook ('example', data, (data) => {
   *   // all pre hooks have run at this point
   *   data.hello = 'goodbye';
   * });
   *
   * // all post hooks have run at this point
   * console.log (data);`
   *
   * @param {String} hook
   */
  async hook (hook, ...args) {
    // set fn
    let fn = false;

    // get function
    if (args.length > 1 && args[args.length - 1] instanceof Function && typeof args[args.length - 1] === 'function' && args[args.length - 1].call) fn = args.splice (-1)[0];

    // check hook
    let fns = this.__hook (hook);

    // exec pres
    for (var a = 0; a < (fns.pre || []).length; a++) {
      // exec pre
      await fns.pre[a] (...args);
    }

    // exec actual function
    if (fn) await fn (...args);

    // exec post
    for (var b = 0; b < (fns.post || []).length; b++) {
      // exec pre
      await fns.post[b] (...args);
    }
  }

  /**
   * checks hook
   *
   * @param {String} hook
   *
   * @returns {Object} register
   * @private
   */
  __hook (hook) {
    // check register
    if (!this.register ('hook')) this.register ('hook', {});

    // check hook exists
    if (!this.register ('hook')[hook]) this.register ('hook')[hook] = {
      'pre'  : [],
      'post' : []
    };

    // return register
    return this.register ('hook')[hook];
  }


  //////////////////////////////////////////////////////////////////////////////
  //
  //  Private Methods
  //
  //////////////////////////////////////////////////////////////////////////////

  /**
   * registers port
   *
   * @private
   *
   * @returns {String}
   */
  _port () {
    // check if main should build
    if (!this.express) return;

    // return true port if clustered
    this.port = config.get ('port');

    // log port
    this.logger.log ('info', 'using express on port ' + this.port, {
      'class' : 'eden'
    });

    // resolve
    return this.port;
  }

  /**
   * registers logger
   *
   * @private
   * @return {winston} logger
   */
  _logger () {
    // set logger
    return new winston.Logger ({
      'level'      : config.get ('logLevel')  || 'info',
      'transports' : [
        new (winston.transports.Console) ({
          'colorize'  : true,
          'formatter' : log,
          'timestamp' : true
        })
      ]
    });
  }

  /**
   * registers eden event emitter
   *
   * @private
   */
  _locks () {
    // get connection
    let conn = config.get ('redis');

    // set prefix
    conn.prefix = config.get ('domain') + '.lock.';

    // create events redis instance
    let client = redis.createClient (conn);

    // set lock
    this._lock = {
      'redis' : new redlock ([client], {
        'retryCount' : -1
      }),
      'client' : client
    };
  }

  /**
   * create cache
   */
  _caches () {
    // create cache
    this.register ('cache', new cacheman (config.get ('redis')));
  }

  /**
   * registers eden event emitter
   *
   * @private
   */
  _events () {
    // get connection
    let conn = config.get ('redis');

    // set prefix
    conn.prefix = config.get ('domain') + '.event';

    // create events redis instance
    this.pubsub = redisEE (conn);

    // create new events class
    this.events = new events ();

    // on specific thread event
    this.pubsub.on ((this.express ? 'express' : 'compute') + ':' + this.id, (channel, data) => {
      // emit to this
      this.emit (data.type, data.data);
    });
  }

  /**
   * registers mongodb database
   *
   * @private
   */
  async _database () {
    // connects to mongo database
    let lock = await this.lock ('database.register', true);
    let plug = new edenModel.plugs[config.get ('database.plug')] (config.get ('database.config'));

    // log registering
    this.logger.log ('info', 'registering database', {
      'class' : 'eden'
    });

    // construct database with plug
    this.database = new edenModel.Db (plug);

    // register models
    for (var key in models) {
      // get model
      let Model = model (key);

      // register
      await this.database.register (Model);

      // await initialize
      await Model.initialize ();
    }

    // log registered
    this.logger.log ('info', 'registered database', {
      'class' : 'eden'
    });

    // unlock
    lock ();
  }

  /**
   * builds daemons
   *
   * @private
   */
  _daemons () {
    // check register
    if (!this.register ('daemon')) this.register ('daemon', {});

    // loop daemons
    for (var file in daemons) {
      // check if should require
      if (!daemons[file].compute && this.compute) continue;
      if (!daemons[file].express && this.express) continue;

      // check correct thread
      if (this.compute && daemons[file].compute !== true && !daemons[file].compute.includes (this.id)) continue;
      if (this.express && daemons[file].express !== true && !daemons[file].express.includes (this.id)) continue;

      // run daemon
      try {
        // require daemon
        let daemon = this.require (file);

        // require daemon
        this.register ('daemon')[file] = new daemon ();

        // log daemon
        this.logger.log ('info', 'running daemon ' + daemons[file].name, {
          'class' : 'eden'
        });
      } catch (e) {
        // print error
        this.error (e);

        // log daemon
        this.logger.log ('error', 'daemon ' + daemons[file].name + ' failed!', {
          'class' : 'eden'
        });
      }
    }
  }
}

/**
 * export eden class
 *
 * @type {eden}
 */
exports = module.exports = new eden ();
