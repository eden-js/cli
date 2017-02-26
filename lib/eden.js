/**
 * Created by Awesome on 1/30/2016.
 */

// require dependencies
const redis     = require ('redis-eventemitter');
const events    = require ('events');
const winston   = require ('winston');
const mongorito = require ('mongorito');

// require local dependencies
const log     = require ('lib/utilities/log');
const config  = require ('app/config');
const daemons = require ('app/cache/daemons.json');

// require eden dependencies
const router = require ('./eden/router');

// build classes
let error  = require ('pretty-error');
    error  = new error ();
let kareem = require ('kareem');
    kareem = new kareem ();

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
 * build bootstrap class
 */
class eden {
  /**
   * construct bootstrap class
   */
  constructor () {
    // bind private variables
    this._ctrl   = {};
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
    this.hook = this.hook.bind (this);

    // bind hook methods
    this.pre  = kareem.pre.bind (kareem);
    this.post = kareem.post.bind (kareem);

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
    this.pubsub   = false;
    this.events   = false;
    this.logger   = opts.logger || this._logger ();
    this.express  = opts.express;
    this.compute  = !opts.express;
    this.database = false;

    // build eden database
    this._database ();

    // bind eden classes
    this.router = opts.express ? new router (this) : false;

    // build eden
    this._events ();
    this._daemons ();
  }

  /**
   * require file
   *
   * @param  {String}   file
   * @param  {Boolean}  doNew
   *
   * @return {Promise}
   */
  async require (file, doNew) {
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
  off (str, fn, all) {
    // remove listener
    return this[all ? 'pubsub' : 'events'][(fn ? 'removeListener' : 'removeAllListeners')] (str, fn);
  }

  /**
   * on function
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
  //  Hook Methods
  //
  //////////////////////////////////////////////////////////////////////////////

  /**
   * adds kareem hook
   *
   * @param {String} hook
   * @param {*} obj
   * @param {Function} fn
   */
  hook (hook, obj, fn) {
    // return Promise
    return new Promise ((resolve, reject) => {
      // execute hook
      kareem.execPre (hook, obj, (err) => {
        // check err
        if (err) return reject (err);

        // exec post
        kareem.execPost (hook, obj, [obj], function () {
          // run return functions
          if (fn) fn.apply (obj, arguments);

          // run return functions
          resolve.apply (obj, arguments);
        });
      });
    });
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
    if (process.env.port) {
      this.port = parseInt (process.env.port);
    } else {
      this.port = config.port;
    }

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
      level      : config.logLevel  || 'info',
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
  _events () {
    // get connection
    let conn = JSON.parse (JSON.stringify (config.redis || {}));

    // set prefix
    conn.prefix = config.domain + ':eden';

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
   * registers mongodb database
   *
   * @private
   */
  _database () {
    // connects to mongo database
    this.database = mongorito.connect (config.database[config.environment].host + '/' + config.database[config.environment].db);
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
      let daemon = await this.controller (file);

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
 * export eden bootstrap
 *
 * @type {eden}
 */
exports = module.exports = new eden ();
