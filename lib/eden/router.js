
// require dependencies
const eden         = require ('eden');
const http         = require ('http');
const multer       = require ('multer');
const express      = require ('express');
const session      = require ('express-session');
const bodyParser   = require ('body-parser');
const redisStore   = require ('connect-redis') (session);
const responseTime = require ('response-time');
const cookieParser = require ('cookie-parser');

// require local dependencies
const acl    = require ('lib/utilities/acl');
const config = require ('config');

// require cache
const routes  = cache ('routes');
const classes = cache ('classes');

// require eden dependencies
const view = require ('./view');


/**
 * builds eden router
 */
class router {
  /**
   * constructs router
   */
  constructor () {
    // set private variables
    this._multer  = false;
    this._server  = false;
    this._express = false;

    // bind methods
    this.build = this.build.bind (this);

    // bind private methods
    this._api     = this._api.bind (this);
    this._ajax    = this._ajax.bind (this);
    this._view    = this._view.bind (this);
    this._error   = this._error.bind (this);
    this._default = this._default.bind (this);

    // bind super private methods
    this.__error  = this.__error.bind (this);
    this.__rotue  = this.__route.bind (this);
    this.__upload = this.__upload.bind (this);
    this.__listen = this.__listen.bind (this);

    // build
    this.build ();
  }

  /**
   * build eden express
   */
  async build () {
    // log building app
    eden.logger.log ('debug', 'building', {
      'class' : 'express'
    });

    // create express
    this._express = express ();

    // set port
    this._express.set ('port', eden.port);

    // create server
    this._server = http.createServer (this._express);

    // listen to port
    this._server.listen (eden.port);

    // listen to server events
    this._server.on ('error',     this.__error);
    this._server.on ('listening', this.__listen);

    // set uploader
    this._multer = multer (config.get ('upload') || {
      'dest' : '/tmp'
    });

    // set use
    ['use', 'get', 'post', 'push', 'delete', 'all'].forEach ((method) => {
      // create mixin method
      this[method] = function () {
        // call express method
        this._express[method].apply (this._express, arguments);
      }
    });

    // run express build methods
    let methods = ['_default', '_api', '_ajax', '_view', '_router', '_error'];

    // do method loop
    for (let i = 0; i < methods.length; i++) {
      // await method
      await this[methods[i]] (this._express);
    }

    // log built express
    eden.logger.log ('debug', 'building completed', {
      'class' : 'express'
    });
  }

  /**
   * adds default uses
   *
   * @param {Express} app
   * @private
   */
  async _default (app) {
    // set default locals
    app.use ((req, res, next) => {
      // set headers
      res.header ('X-Powered-By', 'EdenFrame');

      // set variables
      res.locals.url = req.originalUrl.replace ('/ajx', '');

      // set route start
      res.locals.timer = {
        'start' : new Date ().getTime ()
      };

      // set locals
      res.locals.page = {};
      res.locals.res  = res;

      // go to next
      next ();
    });

    // use functionality
    app.use (responseTime ());
    app.use (bodyParser.json ());
    app.use (bodyParser.urlencoded ({
      'extended' : true
    }));
    app.use (cookieParser (config.get ('secret')));
    app.use (express.static ('www'));
    app.use (session ({
      'key'               : config.get ('session.key') || 'edenjs.session.id',
      'store'             : new redisStore (config.get ('redis')),
      'secret'            : config.get ('secret'),
      'resave'            : false,
      'cookie'            : config.get ('session.cookie') || {
        'secure'   : false,
        'httpOnly' : false
      },
      'proxy'             : true,
      'saveUninitialized' : true
    }));

    // do hook
    await eden.hook ('eden.app', app);
  }

  /**
   * api functionality
   *
   * @param {Express} app
   * @private
   */
  _api (app) {
    // add app headers
    app.all ('/api/*', (req, res, next) => {
      // set headers
      res.header ('Access-Control-Allow-Origin',  '*');
      res.header ('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

      // go to next
      next ();
    });
  }

  /**
   * ajax middleware
   *
   * @param {Express} app
   * @private
   */
  _ajax (app) {
    // add ajax headers
    app.all ('/ajx/*', (req, res, next) => {
      // set response to json
      req.isJSON        = true;
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
  }

  /**
   * view engine
   *
   * @param {Express} app
   * @private
   */
  _view (app) {
    // build view engine
    app.set ('views', global.appRoot + '/app/cache/views');
    app.set ('view engine', 'tag');

    // do view engine
    app.engine ('tag', new view ().render);
  }

  /**
   * build router
   *
   * @param {Express} app
   * @private
   */
  async _router (app) {
    // create express router
    this._router = express.Router ();

    // set router classes
    let routerClasses = Object.keys (classes).map (key => classes[key]);

    // hook routes
    await eden.hook ('eden:classes', routerClasses);

    // sort classes
    routerClasses.sort ((a, b) => {
      // return sort
      return (b.priority || 0) - (a.priority || 0);
    });

    // require classes
    for (let a = 0; a < routerClasses.length; a++) {
      // load controller
      await eden.controller (routerClasses[a].file);
    }

    // hook routes
    await eden.hook ('eden:routes', routes);

    // sort routes
    routes.sort ((a, b) => {
      // return sort
      return (b.priority || 0) - (a.priority || 0);
    });

    // routes forEach
    for (let i = 0; i < routes.length; i++) {
      // run route
      await this.__route (routes[i]);
    }

    // set routes to app
    app.use ('/',    this._router);
    app.use ('/ajx', this._router);
  }

  /**
   * use error handler
   *
   * @param {Express} app
   * @private
   */
  _error (app) {
    // use 404 handler
    app.use ((req, res) => {
      // set status 404
      res.status (404);

      // render 404 page
      res.render ('error', {
        'message' : '404 page not found'
      });
    });
  }

  /**
   * creates route
   *
   * @param {Object} route
   *
   * @private
   */
  async __route (route) {
    // set variables
    let path = (route.mount + route.route).replace ('//', '/');
        path = path.length > 1 ? path.replace (/\/$/, '') : path;

    // create route arguements
    let args = [path];

    // push timer arg
    args.push ((req, res, next) => {
      // set route start time
      res.locals.timer.route = new Date ().getTime ();

      // run next
      next ();
    });

    // check upload
    let upload = this.__upload (route);

    // push upload to args
    if (upload) args.push (upload);

    // add actual route
    args.push (async (req, res, next) => {
      // set route
      res.locals.path = path;

      // set route
      res.locals.route = route;

      // set title
      if (route.title) res.locals.page.title = route.title;

      // run acl middleware
      let aclCheck = await acl.middleware (req, res);

      // alter render function
      let render = res.render;

      // create new render function
      res.render = function () {
        // load arguements
        let args = Array.from (arguments);

        // load view
        if (typeof args[0] !== 'string' && route.view) {
          // unshift Array
          args.unshift (route.view);
        }

        // apply to render
        render.apply (res, args);
      };

      // check acl result
      if (aclCheck === 0) {
        // nexted
        return next ();
      } else if (aclCheck === 2) {
        // redirected
        return;
      }

      // try catch
      try {
        // get controller
        let controller = await eden.controller (route.class);

        // try run function
        return controller[route.fn] (req, res, next);
      } catch (e) {
        // set error
        eden.error (e);

        // run next
        return next ();
      }
    });

    // call router function
    this._router[route.type].apply (this._router, args);
  }

  /**
   * upload method check
   *
   * @param {Object} route
   *
   * @private
   */
  __upload (route) {
    // add upload middleware
    if (route.type !== 'post') return false;

    // set type
    let upType = route.upload && route.upload.type || 'array';

    // set middle
    let upApply = [];

    // check type
    if (route.upload && route.upload.fields) {
      if (upType === 'array') {
        // push to middle
        upApply.push (route.upload.fields.name);
      } else if (upType === 'single') {
        // push single name
        upApply.push (route.upload.fields[0].name);
      } else if (upType === 'fields') {
        // fields
        upApply = fields;
      }
    }

    // check if any
    if (upType === 'any') upApply = [];

    // create upload middleware
    return this._multer[upType].apply (this._multer, upApply);
  }

  /**
   * on error function
   *
   * @param error
   */
  __error (error) {
    // throw error
    if (error.syscall !== 'listen') {
      // throw error
      eden.error (error);
    }

    // bind check
    let bind = typeof this.port === 'string' ? 'Pipe ' + this.port : 'Port ' + this.port;

    // handle specific listen errors with friendly messages
    if (error.code === 'EACCES') {
      // log error
      eden.logger.log ('error', bind + ' requires elevated privileges', {
        'class' : 'eden'
      });

      // exit
      process.exit (1);
    } else if (error.code === 'EADDRINUSE') {
      // log error
      eden.logger.log ('error', bind + ' is already in use', {
        'class' : 'eden'
      });

      // exit
      process.exit (1);
    } else {
      // throw error
      eden.error (error);
    }
  }

  /**
   * on listen function
   */
  __listen () {
    // get server address
    let addr = this._server.address ();

    // check if string
    let bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  }
}

/**
 * export router class
 *
 * @type {router}
 */
exports = module.exports = router;
