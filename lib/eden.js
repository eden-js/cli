
// require dependencies
const lock      = require ('async-lock');
const util      = require ('util');
const uuid      = require ('uuid');
const redis     = require ('redis');
const events    = require ('events');
const winston   = require ('winston');
const redisEE   = require ('redis-eventemitter');
const cacheman  = require ('cacheman-redis');
const redisLock = require ('redis-lock');
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
    this._lock   = {};
    this._ctrl   = {};
    this._hooks  = {};
    this._cache  = {};
    this._daemon = {};

    // bind methods
    this.start      = this.start.bind (this);
    this.error      = this.error.bind (this);
    this.require    = this.require.bind (this);
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
   * start eden framework
   *
   * @param {Object} opts
   */
  async start (opts) {
    // set variables
    this.id       = opts.id;
    this.port     = opts.port || this._port ();
    this.host     = opts.host || config.get ('host') || '0.0.0.0';
    this.view     = false;
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

    // connect database
    await this._database ();

    // require router
    let router = require ('./eden/router');

    // bind eden classes
    this.router = opts.express ? new router () : false;

    // build daemons
    await this._daemons ();
  }

  /**
   * require file
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
   * run controller
   *
   * @param  {String} file
   *
   * @return {[type]}      [description]
   */
  async controller (file) {
    // try catch
    try {
      // check if controller registered
      if (!this._ctrl[file]) {
        // require controller
        let ctrl = await this.require (file);

        // register controller
        this._ctrl[file] = new ctrl ();
      }

      // resolve
      return this._ctrl[file];
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
   * @param  {Error} e
   */
  error (e) {
    // log error
    console.log (error.render (e));

    // emit error
    this.emit ('eden.error', e);
  }


  //////////////////////////////////////////////////////////////////////////////
  //
  //  Event Methods
  //
  //////////////////////////////////////////////////////////////////////////////

  /**
   * on function
   *
   * @param  {String}   str
   * @param  {Function} fn
   * @param  {Boolean}  all
   */
  on (str, fn, all) {
    // on str/fn
    if (all) {
      // pubsub on
      this.pubsub.on (str, (channel, data) => {
        // run function
        fn (data);
      });
    } else {
      // add event listener
      this.events.on (str, fn);
    }
  }

  /**
   * on function
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
   * on function
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
   * create faux RPC
   *
   * @param  {String}  str
   * @param  {Array}   args
   *
   * @return {Promise}     [description]
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
   * create RPC endpoint
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
   * on function
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
   * emit to main thread
   *
   * @param {String} str
   * @param {Object} obj
   *
   * @return {*}
   */
  main (str, obj) {
    // emit function
    return this.pubsub.emit ('main', {
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
   * returns lock
   * @param  {String}  key
   * @param  {Boolean} all
   *
   * @return {Promise}
   */
  async lock (key, all) {
    // set dones
    let callbacks = [];

    // add to callbacks
    callbacks.push (await new Promise ((res) => {
      // resolve acquire
      this._lock.local.acquire (key, res);
    }));
    if (all) callbacks.push (await this._lock.redis (key));

    // return complete function
    return () => {
      // loop callbacks
      callbacks.forEach ((cb) => {
        // run callback
        cb ();
      });
    };
  }

  //////////////////////////////////////////////////////////////////////////////
  //
  //  Cache Methods
  //
  //////////////////////////////////////////////////////////////////////////////

  /**
   * sets cache
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
    let get = util.promisify (this._cache.get.bind (this._cache));

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
   * sets cache
   *
   * @param  {String} key
   * @param  {*} value
   * @param  {Integer} ttl
   *
   * @return {*}
   */
  async set (key, value, ttl) {
    // promisify get
    let set = util.promisify (this._cache.set.bind (this._cache));

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
   * @param {String} key
   *
   * @returns {Promise}
   */
  del (key) {
    // promisify get
    let del = util.promisify (this._cache.del.bind (this._cache));

    // await get
    return del (key);
  }

  /**
   * delete cache
   *
   * @returns {Promise}
   */
  clear () {
    // promisify get
    let clear = util.promisify (this._cache.clear.bind (this._cache));

    // await get
    return clear ();
  }


  //////////////////////////////////////////////////////////////////////////////
  //
  //  Hook Methods
  //
  //////////////////////////////////////////////////////////////////////////////

  /**
   * add post hook to act as pre
   *
   * @param {String} hook
   * @param {Function} fn
   */
  pre (hook, fn) {
    // check hook
    this.__hook (hook);

    // add to post
    this._hooks[hook].pre.push (fn);
  }

  /**
   * add post hook to act as pre
   *
   * @param {String} hook
   * @param {Function} fn
   */
  post (hook, fn) {
    // check hook
    this.__hook (hook);

    // add to post
    this._hooks[hook].post.push (fn);
  }


  /**
   * adds kareem hook
   *
   * @param {String} hook
   */
  async hook (hook, ...args) {
    // set fn
    let fn = false;

    // get function
    if (args.length > 1 && args[args.length - 1] instanceof Function && typeof args[args.length - 1] === 'function' && args[args.length - 1].call) fn = args.splice (-1)[0];

    // check hook
    this.__hook (hook);

    // exec pres
    for (var a = 0; a < this._hooks[hook].pre.length; a++) {
      // exec pre
      await this._hooks[hook].pre[a] (...args);
    }

    // exec actual function
    if (fn) await fn (...args);

    // exec post
    for (var b = 0; b < this._hooks[hook].post.length; b++) {
      // exec pre
      await this._hooks[hook].post[b] (...args);
    }
  }

  /**
   * checks hook
   *
   * @param {String} hook
   *
   * @private
   */
  __hook (hook) {
    // check hook exists
    if (!this._hooks[hook]) this._hooks[hook] = {
      'pre'  : [],
      'post' : []
    };
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
    conn.prefix = config.get ('domain') + '.lock';

    // create events redis instance
    let client = redis.createClient (conn);

    // create new events class
    this._lock = {
      'redis' : util.promisify (redisLock (client)),
      'local' : new lock ({
        'maxPending' : config.get ('lock.maxPending')
      })
    };
  }

  /**
   * create cache
   */
  _caches () {
    // create cache
    this._cache = new cacheman (config.get ('redis'));
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

    // on function
    if (this.main) {
      // only on this thread
      this.pubsub.on ('main', (channel, data) => {
        // emit to this thread
        this.emit (data.type, data.data);
      });
    }
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
  async _daemons () {
    // loop daemons
    for (var file in daemons) {
      // check if should require
      if (!daemons[file].compute && this.compute) continue;
      if (!daemons[file].express && this.express) continue;

      // require daemon
      await this.controller (file);

      // run daemon
      try {
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
