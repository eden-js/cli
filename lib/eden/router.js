
// require dependencies
const http         = require ('http');
const multer       = require ('multer');
const express      = require ('express');
const session      = require ('express-session');
const bodyParser   = require ('body-parser');
const redisStore   = require ('connect-redis') (session);
const responseTime = require ('response-time');
const cookieParser = require ('cookie-parser');

// require local dependencies
const acl     = require ('lib/utilities/acl');
const config  = require ('app/config');
const routes  = require ('app/cache/routes.json');
const classes = require ('app/cache/classes.json');

// require eden dependencies
const view = require ('./view');


/**
 * builds eden router
 */
class router {
  /**
   * constructs router
   *
   * @param {eden} eden
   */
  constructor (eden) {
    // set private variables
    this._eden    = eden;
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
    this.build (eden);
  }

  /**
   * build eden express
   *
   * @param {eden} eden
   */
  async build (eden) {
    // log building app
    this._eden.logger.log ('debug', 'building', {
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

    // set use
    ['use', 'get', 'post', 'push', 'delete', 'all'].forEach ((method) => {
      // create mixin method
      this[method] = function () {
        // call express method
        this._express[method].apply (this._express, arguments);
      }
    });

    // set uploader
    this._multer = multer (config.upload || {
      'dest' : '/tmp'
    });

    // run express build methods
    let methods = ['_default', '_api', '_ajax', '_view', '_router', '_error'];

    // do method loop
    for (let i = 0; i < methods.length; i++) {
      // await method
      await this[methods[i]] (this._express);
    }

    // log built express
    this._eden.logger.log ('debug', 'building completed', {
      'class' : 'express'
    });
  }

  /**
   * adds default uses
   *
   * @param {Express} app
   * @private
   */
  _default (app) {
    // use
    app.use (responseTime ());
    app.use (bodyParser.json ());
    app.use (bodyParser.urlencoded ({
      'extended' : true
    }));
    app.use (cookieParser (config.secret));
    app.use (express.static ('www'));
    app.use (session ({
      'key'               : config.session.key || 'eden.session.id',
      'store'             : new redisStore (config.redis || {}),
      'secret'            : config.secret,
      'resave'            : false,
      'cookie'            : config.session.cookie || {
        'secure'   : false,
        'httpOnly' : false
      },
      'saveUninitialized' : true
    }));

    // set default locals
    app.use ((req, res, next) => {
      // set headers
      res.header ('X-Powered-By', 'EdenFrame');

      // set variables
      res.locals.url = req.originalUrl.replace ('/ajx', '');

      // set route start
      res.locals.routeStart = new Date ().getTime ();

      // set locals
      res.locals.page = {};

      // go to next
      next ();
    });
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
    app.engine ('tag', new view (this._eden).render);
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

    // set classes
    let routerClasses = Object.keys (classes);

    // sort classes
    routerClasses.sort ((a, b) => {
      // return sort
      return b.priority - a.priority;
    });

    // require classes
    for (let a = 0; a < routerClasses.length; a++) {
      // load controller
      await this._eden.controller (routerClasses[a]);
    }

    // sort routes
    routes.sort ((a, b) => {
      // return sort
      return b.priority - a.priority;
    });

    // routes forEach
    for (let i = 0; i < routes.length; i++) {
      // run route
      await this.__route (app, routes[i]);
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
   * @param {Express} app
   * @param {Object} route
   *
   * @private
   */
  async __route (app, route) {
    // set variables
    let path = (route.mount + route.route).replace ('//', '/');
        path = path.length > 1 ? path.replace (/\/$/, '') : path;

    // create route arguements
    let args = [path];

    // check upload
    let upload = this.__upload (app, route);

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
        let controller = await this._eden.controller (route.class);

        // try run function
        return controller[route.fn] (req, res, next);
      } catch (e) {
        // set error
        this._eden.error (e);

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
   * @param {Express} app
   * @param {Object} route
   *
   * @private
   */
  __upload (app, route) {
    // add upload middleware
    if (route.type !== 'post') return;

    // set type
    let upType = route.upload && route.upload.type || 'array';

    // set middle
    let upApply = [];

    // check type
    if (route.upload && route.upload.fields) {
      if (upType === 'array') {
        // push to middle
        upApply.push (route.upload.fields.name);

        // check if count
        if (route.upload.fields.maxCount) middle.push (route.upload.fields.maxCount);
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
    let upload = this._multer[upType].apply (this._multer, upApply);

    // return middleware
    return upload;
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
      this.error (error);
    }

    // bind check
    let bind = typeof this.port === 'string' ? 'Pipe ' + this.port : 'Port ' + this.port;

    // handle specific listen errors with friendly messages
    if (error.code === 'EACCES') {
      // log error
      this._eden.logger.log ('error', bind + ' requires elevated privileges', {
        'class' : 'eden'
      });

      // exit
      process.exit (1);
    } else if (error.code === 'EADDRINUSE') {
      // log error
      this._eden.logger.log ('error', bind + ' is already in use', {
        'class' : 'eden'
      });

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
