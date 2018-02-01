
// require dependencies
const lock      = require ('async-lock');
const redis     = require ('redis');
const events    = require ('events');
const winston   = require ('winston');
const redisEE   = require ('redis-eventemitter');
const redisLock = require ('redis-lock');
const edenModel = require ('edenjs-model');

// require local dependencies
const log    = require ('lib/utilities/log');
const config = require ('config');

// require cached resources
const models  = cache ('models');
const daemons = cache ('daemons');

// build classes
let error  = require ('pretty-error');
error      = new error ();
let cached = require ('cacheman-redis');
cached     = new cached (config.get ('redis'));

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
    this._daemon = {};

    // bind methods
    this.start      = this.start.bind (this);
    this.error      = this.error.bind (this);
    this.require    = this.require.bind (this);
    this.controller = this.controller.bind (this);

    // bind event methods
    this.on   = this.on.bind (this);
    this.off  = this.off.bind (this);
    this.emit = this.emit.bind (this);
    this.once = this.once.bind (this);

    // bind lock methods
    this.lock = this.lock.bind (this);

    // bind hook methods
    this.pre  = this.pre.bind (this);
    this.post = this.post.bind (this);
    this.hook = this.hook.bind (this);

    // bind cache methods
    this.get = this.get.bind (this);
    this.set = this.set.bind (this);
    this.del = this.del.bind (this);

    // bind private methods
    this._port     = this._port.bind (this);
    this._locks    = this._locks.bind (this);
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
  async require (file) {
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
    this.emit ('eden:error', e);
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
   */
  off (str, fn, all) {
    // remove listener
    return this[all ? 'pubsub' : 'events'][(fn ? 'removeListener' : 'removeAllListeners')] (str, fn);
  }

  /**
   * on function
   *
   * @param  {String}  str
   * @param  {Array}   args
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
  lock (key, all) {
    // set dones
    let callbacks = [];

    // set done function
    let complete = () => {
      // loop callbacks
      callbacks.forEach ((cb) => cb ());
    };

    // return Promise
    return new Promise ((resolve) => {
      // acquire lock
      this._lock.local.acquire (key, (done) => {
        // acquire new redis lock
        if (!all) return resolve (done);

        // push to callbacks
        callbacks.push (done);

        // acquire redis lock
        this._lock.redis (key, (redisDone) => {
          // push to callbacks
          callbacks.push (redisDone);

          // resolve complete
          return resolve (complete);
        });
      });
    });
  }

  //////////////////////////////////////////////////////////////////////////////
  //
  //  Cache Methods
  //
  //////////////////////////////////////////////////////////////////////////////

  /**
   * sets cache
   *
   * @param  {String} key
   *
   * @return {*}
   */
  get (key) {
    // return Promise
    return new Promise ((resolve, reject) => {
      // cache get
      cached.get (key, (err, value) => {
        // check err
        if (err) return reject (err);

        // check value
        if (value && typeof value === 'object' && value.id && value.model) {
          // load type
          value = model (value.model).findById (value.id);
        }

        // return value
        resolve (value);
      });
    });
  }

  /**
   * sets cache
   *
   * @param  {String} key
   * @param  {*} value
   *
   * @return {*}
   */
  set (key, value) {
    // return Promise
    return new Promise ((resolve, reject) => {
      // check value
      if (value instanceof require ('model') && value.get && value.get ('_id')) {
        // set value
        value = {
          'id'    : value.get ('_id').toString (),
          'model' : value.constructor.name
        };
      }

      // set cache value
      cached.set (key, value, (err, value) => {
        // check err
        if (err) return reject (err);

        // resolve
        resolve (value);
      });
    });
  }

  /**
   * delete cache by key
   *
   * @param {String} key
   */
  del (key) {
    // return Promise
    return new Promise ((resolve, reject) => {
      // delete from cache
      cached.del (key, (err) => {
        // check err
        if (err) return reject (err);

        // resolve
        resolve ();
      });
    });
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
    if (args.length > 1 && args[args.length - 1] instanceof Function && typeof args[args.length -1] === 'function' && args[args.length - 1].call) fn = args.splice (-1)[0];

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
      level      : config.get ('logLevel')  || 'info',
      transports : [
        new (winston.transports.Console) ({
          colorize  : true,
          formatter : log,
          timestamp : true
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
      'redis' : redisLock (client),
      'local' : new lock ()
    };
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
    let plug = new edenModel.plugs[config.get ('database.plug')] (config.get ('database.config'));
    let lock = await this.lock ('database.register', true);

    // construct database with plug
    this.database = new edenModel.Db (plug);

    // register models
    for (var key in models) {
      // register
      await this.database.register (model (key));
    }

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
