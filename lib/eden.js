/**
 * Created by Awesome on 1/30/2016.
 */

// use strict
'use strict';

// require dependencies
var http         = require ('http');
var redis        = require ('redis-eventemitter');
var events       = require ('events');
var express      = require ('express');
var session      = require ('express-session');
var winston      = require ('winston');
var mongorito    = require ('mongorito');
var fileUpload   = require ('express-fileupload');
var bodyParser   = require ('body-parser');
var redisStore   = require ('connect-redis') (session);
var prettyError  = require ('pretty-error');
var responseTime = require ('response-time');
var cookieParser = require ('cookie-parser');

// require local dependencies
var acl     = require ('lib/utilities/acl');
var log     = require ('lib/utilities/log');
var config  = require ('app/config');
var engine  = require ('lib/utilities/engine');
var routes  = require ('app/cache/routes.json');
var classes = require ('app/cache/classes.json');
var daemons = require ('app/cache/daemons.json');

/**
 * build bootstrap class
 */
class eden {
  /**
   * construct bootstrap class
   */
  constructor (opts) {
    // bind variables
    this.app    = false;
    this.port   = false;
    this.server = false;
    this.router = false;
    this.pubsub = false;
    this.events = false;

    // bind event emitter functions
    this.on   = this.on.bind (this);
    this.off  = this.off.bind (this);
    this.emit = this.emit.bind (this);

    // bind private variables
    this._ctrl   = {};
    this._daemon = {};

    // bind methods
    this.require    = this.require.bind (this);
    this.onError    = this.onError.bind (this);
    this.onListen   = this.onListen.bind (this);
    this.controller = this.controller.bind (this);

    // bind private methods
    this._getPort = this._getPort.bind (this);

    // set in global scope
    global.eden = this;

    // bind registration methods
    this._register = [
      '_registerEventEmitter',
      '_registerLogger',
      '_registerDatabase'
    ];

    // bind and run register methods
    for (var i = 0; i < this._register.length; i ++) {
      this[this._register[i]] = this[this._register[i]].bind (this);
      this[this._register[i]] (opts);
    }

    // bind build methods
    this._build = [
      '_buildApp',
      '_buildLocals',
      '_buildView',
      '_buildRouter',
      '_buildDaemons'
    ];

    // process events
    process.on ('uncaughtException',  this.error);
    process.on ('unhandledRejection', this.error);

    // build app and server
    this._getPort ().then (() => {
      // loop build to bind build methods
      for (var i = 0; i < this._build.length; i ++) {
        // bind build method
        this[this._build[i]] = this[this._build[i]].bind (this);
        // execute build method
        this[this._build[i]] ();
      }

      // server events
      this.server.on ('error',     this.onError);
      this.server.on ('listening', this.onListen);
    });
  }

  ////////////////////////////////////////////////////////////////////////////
  //
  //  REGISTER FUNCTIONS
  //
  ////////////////////////////////////////////////////////////////////////////

  /**
   * registers logger
   *
   * @param {Object} opts
   *
   * @private
   */
  _registerLogger (opts) {
    // set logger
    this.logger = (opts.logger || new winston.Logger ({
      level      : config.logLevel  || 'info',
      transports : [
        new (winston.transports.Console) ({
          colorize  : true,
          formatter : log,
          timestamp : true
        })
      ]
    }));

    // register as global
    global.logger = this.logger;
  }

  /**
   * registers eden event emitter
   *
   * @private
   */
  _registerEventEmitter () {
    // create events redis instance
    this.pubsub = redis ({
      'host'   : 'localhost',
      'port'   : 6379,
      'prefix' : config.domain + ':eden:'
    });

    // create new events class
    this.events = new events ();
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
   * builds app
   *
   * @private
   */
  _buildApp () {
    // log building app
    this.logger.log ('debug', 'building express app');

    // create express app
    this.app = express ();

    // set port
    this.app.set ('port', this.port);

    // create http server
    this.server = this.server ? this.server : http.createServer (this.app);

    // set port
    this.server.listen (this.port);

    // set default uses
    this.app.use (responseTime ());
    this.app.use (bodyParser.json ());
    this.app.use (bodyParser.urlencoded ({
      extended : true
    }));
    this.app.use (fileUpload ());
    this.app.use (cookieParser (config.secret));
    this.app.use (express.static ('www'));
    this.app.use (session ({
      key               : config.session.key || 'eden.session.id',
      store             : new redisStore (),
      secret            : config.secret,
      resave            : false,
      cookie            : config.session.cookie || {
        httpOnly : false,
        secure   : false
      },
      saveUninitialized : true
    }));

    // set default locals
    this.app.use ((req, res, next) => {
      // set headers
      res.header ('X-Powered-By', 'EdenFrame');

      // set variables
      res.locals.url    = req.originalUrl.replace ('/ajx', '');
      res.locals.domain = config.domain;

      // set route start
      res.locals.routeStart = new Date ().getTime ();

      // go to next
      next ();
    });

    // set CORS on api
    this.app.all ('/api/*', (req, res, next) => {
      // set headers
      res.header ('Access-Control-Allow-Origin',  '*');
      res.header ('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

      // go to next
      next ();
    });

    // set CORS on api
    this.app.all ('/ajx/*', (req, res, next) => {
      // set response to json
      res.locals.isJSON = true;

      // set header
      res.setHeader ('Content-Type', 'application/json');

      // set res.redirect
      res.redirect = (url) => {
        // render json
        res.json ({
          'redirect' : url
        });
      };

      // go to next
      next ();
    });

    // log building app
    this.logger.log ('debug', 'finished building express app');
  }

  /**
   * builds local variables
   *
   * @private
   */
  _buildLocals () {
    // log building app
    this.logger.log ('debug', 'building app locals');

    // set locals
    this.app.locals.title  = config.title;
  }

  /**
   * builds view engine
   *
   * @private
   */
  _buildView () {
    // build view engine
    this.app.set ('views', global.appRoot + '/app/cache/views');
    this.app.set ('view engine', 'tag');
    this.app.engine ('tag', new engine ().render);
  }

  /**
   * router
   *
   * @private
   */
  async _buildRouter () {
    // build router
    this.router = (this.router ? this.router : express.Router ());

    // set classes
    var sortedClasses = Object.keys (classes).map ((key) => {
      return classes[key];
    });

    // get classes
    sortedClasses.sort ((a, b) => {
      // return sort
      return b.priority - a.priority;
    });

    // loop classes
    for (var a = 0; a < sortedClasses.length; a++) {
      // load controller
      await this.controller (sortedClasses[a].file);
    }

    // set routes
    routes.sort ((a, b) => {
      // return sort
      return b.priority - a.priority;
    });

    // loop routes
    for (var b = 0; b < routes.length; b++) {
      // set route
      let route = routes[b];
      let path  = (route.mount + route.route).replace ('//', '/');
          path  = path.length > 1 ? path.replace (/\/$/, '') : path;

      // add route
      this.router[route.type] (path, async (req, res, next) => {
        // set route
        res.locals.path = path;

        // set route
        res.locals.route = route;

        // run acl middleware
        if (!await acl.middleware (req, res)) {
          return next ();
        }

        // try catch
        try {
          // try run function
          return await this._ctrl[route.class][route.fn] (req, res, next);
        } catch (e) {
          // set error
          this.error (e);

          // run next
          return next ();
        }
      });
    }

    // set routes to app
    this.app.use ('/',    this.router);
    this.app.use ('/ajx', this.router);

    // use 404 handler
    this.app.use ((req, res) => {
      // set status 404
      res.status (404);

      // render 404 page
      res.render ('error', {
        'message' : '404 page not found'
      });
    });
  }

  /**
   * builds daemons
   *
   * @private
   */
  async _buildDaemons () {
    // loop daemons
    for (var i = 0; i < daemons.length; i++) {
      // require daemon
      var daemon = await this.controller (daemons[i]);

      // run daemon
      try {
        // log daemon
        this.logger.log ('info', 'running daemon ' + daemon.constructor.name);
      } catch (e) {
        // print error
        this.error (e);

        // log daemon
        this.logger.log ('error', 'daemon ' + daemon.constructor.name + ' failed!');
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
  async _getPort () {
    // return true port if clustered
    if (process.env.port) {
      this.port = parseInt (process.env.port);
    } else {
      this.port = config.port;
    }

    // log port
    this.logger.log ('info', 'using express on port ' + this.port);

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
   * on error function
   *
   * @param error
   */
  onError (error) {
    // throw error
    if (error.syscall !== 'listen') {
      // throw error
      this.error (error);
    }

    // bind check
    var bind = typeof this.port === 'string' ? 'Pipe ' + this.port : 'Port ' + this.port;

    // handle specific listen errors with friendly messages
    if (error.code === 'EACCES') {
      // log error
      this.logger.log ('error', bind + ' requires elevated privileges');

      // exit
      process.exit (1);
    } else if (error.code === 'EADDRINUSE') {
      // log error
      this.logger.log ('error', bind + ' is already in use');

      // exit
      process.exit (1);
    } else {
      // throw error
      this.error (error);
    }
  }

  /**
   * on listen function
   */
  onListen () {
    // get server address
    var addr = this.server.address ();

    // check if string
    var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
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
    this.logger.log ('debug', 'requiring ' + file);

    // try catch
    try {
      // try require
      var req = require (file);

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
        var ctrl = await this.require (file);

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
    var pe = new prettyError ();

    // log error
    console.log (pe.render (e));
  }
}

/**
 * export eden bootstrap
 *
 * @type {eden}
 */
module.exports = eden;
