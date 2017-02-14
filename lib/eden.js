/**
 * Created by Awesome on 1/30/2016.
 */

// use strict
'use strict';

// require dependencies
const http         = require ('http');
const redis        = require ('redis-eventemitter');
const events       = require ('events');
const kareem       = require ('kareem');
const multer       = require ('multer');
const session      = require ('express-session');
const winston      = require ('winston');
const mongorito    = require ('mongorito');
const bodyParser   = require ('body-parser');
const redisStore   = require ('connect-redis') (session);
const prettyError  = require ('pretty-error');
const responseTime = require ('response-time');
const cookieParser = require ('cookie-parser');

// require local dependencies
const acl     = require ('lib/utilities/acl');
const log     = require ('lib/utilities/log');
const view    = require ('lib/utilities/view');
const config  = require ('app/config');
const routes  = require ('app/cache/routes.json');
const classes = require ('app/cache/classes.json');
const daemons = require ('app/cache/daemons.json');

const router = require ('./eden/router');

/**
 * build bootstrap class
 */
class eden {
  /**
   * construct bootstrap class
   */
  constructor (opts) {
    // set variables
    this.id     = opts.id;
    this.port   = opts.port   || this._port ();
    this.logger = opts.logger || this._logger ();

    // bind eden classes
    this.router = opts.express ? new router (this) : false;


    // bind variables
    this.id      = opts.id;
    this.pe      = new prettyError ();
    this.port    = this._port ();
    this.hooks   = new kareem ();
    this.pubsub  = false;
    this.events  = false;
    this.compute = !opts.express;

    // bind event emitter functions
    this.on   = this.on.bind (this);
    this.off  = this.off.bind (this);
    this.emit = this.emit.bind (this);
    this.hook = this.hook.bind (this);

    // add pre and post methods
    this.pre  = this.hooks.pre.bind (this.hooks);
    this.post = this.hooks.post.bind (this.hooks);

    // bind private variables
    this._ctrl   = {};
    this._daemon = {};

    // bind methods
    this.error      = this.error.bind (this);
    this.require    = this.require.bind (this);
    this.controller = this.controller.bind (this);

    // set in global scope
    global.eden = this;

    // bind registration methods
    this._register = [
      '_registerEventEmitter',
      '_registerDatabase'
    ];

    // bind and run register methods
    for (var i = 0; i < this._register.length; i ++) {
      this[this._register[i]] = this[this._register[i]].bind (this);
      this[this._register[i]] (opts);
    }

    // bind build methods
    this._build = [
      '_buildDaemons'
    ];

    // process events
    process.on ('uncaughtException',  this.error);
    process.on ('unhandledRejection', this.error);

    // loop build to bind build methods
    for (var i = 0; i < this._build.length; i ++) {
      // bind build method
      this[this._build[i]] = this[this._build[i]].bind (this);
      // execute build method
      this[this._build[i]] ();
    }
  }

  ////////////////////////////////////////////////////////////////////////////
  //
  //  REGISTER FUNCTIONS
  //
  ////////////////////////////////////////////////////////////////////////////

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
  _registerEventEmitter () {
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
  _registerDatabase () {
    // connects to mongo database
    this.database = mongorito.connect (config.database[config.environment].host + '/' + config.database[config.environment].db);
  }

  ////////////////////////////////////////////////////////////////////////////
  //
  //  BUILD FUNCTIONS
  //
  ////////////////////////////////////////////////////////////////////////////

  /**
   * builds daemons
   *
   * @private
   */
  async _buildDaemons () {
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

  ////////////////////////////////////////////////////////////////////////////
  //
  //  Getters and Setters
  //
  ////////////////////////////////////////////////////////////////////////////

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

  ////////////////////////////////////////////////////////////////////////////
  //
  //  Event Functions
  //
  ////////////////////////////////////////////////////////////////////////////

  /**
   * on function
   *
   * @param  {String}   str
   * @param  {Function} fn
   * @param  {Boolean}  all
   */
  on (str, fn, all) {
    // on str/fn
    return this[all ? 'pubsub' : 'events'].on (str, fn);
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
      this.hooks.execPre (hook, obj, (err) => {
        // check err
        if (err) return reject (err);

        // exec post
        this.hooks.execPost (hook, obj, [obj], function () {
          // run return functions
          if (fn) fn.apply (obj, arguments);

            // run return functions
          resolve.apply (obj, arguments);
        });
      });
    });
  }

  ////////////////////////////////////////////////////////////////////////////
  //
  //  Misc Fucntions
  //
  ////////////////////////////////////////////////////////////////////////////

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
        this._ctrl[file] = new ctrl (this);
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
    console.log (this.pe.render (e));

    // emit error
    this.emit ('eden:error', e);
  }
}

/**
 * export eden bootstrap
 *
 * @type {eden}
 */
module.exports = eden;
