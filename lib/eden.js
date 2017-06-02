
// require dependencies
const redis      = require ('redis-eventemitter');
const events     = require ('events');
const winston    = require ('winston');
const mongorito  = require ('mongorito');
const timestamps = require ('mongorito-timestamps');

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
  start (opts) {
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

    // build eden database
    this._events ();
    this._database ();
    this._daemons ();

    // require router
    let router = require ('./eden/router');

    // bind eden classes
    this.router = opts.express ? new router () : false;
  }

  /**
   * safely requires file
   *
   * in most cases `require()` is fine, however for core and controller methods
   * we use a try catch to check for syntax issues
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
   * requires and starts controller
   *
   * this method does not pass any variables to the controllers constructor
   *
   * @param  {String} file
   *
   * @return {*}
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
   * creates event listener function
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
   * removes event listener function
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
   * once listener function
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
   * emits event to either pubsub or events
   *
   * to send an eden event across all threads, simply use
   *   eden.emit ('event.name', {...eventData}, true);
   *
   * to send an eden event only to the current thread, simply use
   *   eden.emit ('event.name', {...eventData});
   *
   * @param  {String}  str
   * @param  {Object}  obj
   * @param  {Boolean} all
   */
  emit (str, obj, all) {
    // emit function
    return this[all ? 'pubsub' : 'events'].emit (str, obj);
  }

  /**
   * emits event to main thread
   *
   * this will emit only to the first express thread
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
  //  Cache Methods
  //
  //////////////////////////////////////////////////////////////////////////////

  /**
   * gets eden variable across threads
   *
   * this will then resolve in any eden express or compute thread using
   *    await eden.get ('data.key'); // dataValue
   *
   * @param  {String} key
   *
   * @return {Promise}
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
   * sets eden variable across threads
   *
   * this method allows us to store data in redis across multiple eden threads,
   * to store data simply run
   *    eden.set ('data.key', {...dataValue});
   * this will then resolve in any eden express or compute thread using
   *    await eden.get ('data.key'); // dataValue
   *
   * We can also store models here
   *
   * @param  {String} key
   * @param  {*} value
   *
   * @return {Promise}
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
   * deletes eden variable by key
   *
   * @param {String} key
   *
   * @return {Promise}
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
   * create pre hook functionality
   *
   * This will be fired before all of the post hooks as well as the hook iteself
   *
   * To create a pre hook, use eden.pre ('hook.whatever', (hookVariable) => {
   *   // do logic here
   *   hookVariable.set ('otherVariable', true);
   * });
   *
   * @param {String}   hookName
   * @param {Function} hookFn
   */
  pre (hookName, hookFn) {
    // check hook
    this.__hook (hookName);

    // add to post
    this._hooks[hookName].pre.push (hookFn);
  }

  /**
   * create post hook functionality
   *
   * This will be fired after all of the pre hooks and the function hook itself
   * has been fired
   *
   * To create a post hook, use eden.post ('hook.whatever', (hookVariable) => {
   *   // do logic here
   *   hookVariable.set ('otherVariable', true);
   * });
   *
   * @param {String}   hookName
   * @param {Function} hookFn
   */
  post (hookName, hookFn) {
    // check hook
    this.__hook (hookName);

    // add to post
    this._hooks[hookName].post.push (hookFn);
  }


  /**
   * run eden hook
   *
   * This will fire all hook functionality
   *
   * @param {String} hook
   * @param {*} obj
   * @param {Function} fn
   */
  async hook (hookName, hookedItem, hookedFn) {
    // check hook
    this.__hook (hookName);

    // exec pres
    for (var a = 0; a < this._hooks[hookName].pre.length; a++) {
      // exec pre
      await this._hooks[hookName].pre[a].apply (hookedItem, [hookedItem]);
    }

    // exec actual hooked function
    if (hookedFn) await hookedFn.apply (hookedItem, [hookedItem]);

    // exec post
    for (var b = 0; b < this._hooks[hookName].post.length; b++) {
      // exec pre
      await this._hooks[hookName].post[b].apply (hookedItem, [hookedItem]);
    }
  }

  /**
   * checks if hook arrays exist, creates them if they dont
   *
   * @param {String} hook
   *
   * @private
   */
  __hook (hookName) {
    // create hook arrays if they dont exist
    if (!this._hooks[hookName]) this._hooks[hookName] = {
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
   * registers the port for listening
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
   * builds winston logger method, unless a logger is already used
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
   * creates redis event emitter for cross-thread event emission
   *
   * to send an eden event across all threads, simply use
   *   eden.emit ('event.name', {...eventData}, true);
   *
   * to send an eden event only to the current thread, simply use
   *   eden.emit ('event.name', {...eventData});
   *
   * using eden.emit without the ending `true` will only emit the event to the
   * current thread
   *
   * @private
   */
  _events () {
    // get connection
    let conn = config.get ('redis');

    // set prefix
    conn.prefix = config.get ('domain') + '.event';

    // create events redis instance
    this.pubsub = redis (conn);

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
   * creates mongodb instance using mongorito
   *
   * take a look at https://github.com/vadimdemedes/mongorito for more info
   *
   * @private
   */
  _database () {
    // connects to mongo database
    this.database = new mongorito.Database (config.get ('database')[config.get ('environment')].host + '/' + config.get ('database')[config.get ('environment')].db);

    // connect database
    this.database.connect ();

    // use timestamps
    this.database.use (timestamps ());

    // register models
    for (var key in models) {
      // register
      this.database.register (model (key));
    }
  }

  /**
   * runs daemon methods, these are essentially services that run in the
   * background independent of user actions
   *
   * app/bundles/{bundle}/daemons/{name}.js is automatically run when it has
   * either @compute or @express or both annotations on it's class
   *
   * @private
   */
  async _daemons () {
    // loop daemons
    for (var file in daemons) {
      // check if should require
      if (!daemons[file].compute && this.compute) continue;
      if (!daemons[file].express && this.express) continue;

      // we require it as a controller to do all the new Daemon() logic
      await this.controller (file);

      // run daemon
      try {
        // log daemon running
        this.logger.log ('info', 'running daemon ' + daemons[file].name, {
          'class' : 'eden'
        });
      } catch (e) {
        // print error
        this.error (e);

        // log daemon failed to start
        this.logger.log ('error', 'daemon ' + daemons[file].name + ' failed', {
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
