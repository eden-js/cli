// Require dependencies
const http         = require('http');
const multer       = require('multer');
const express      = require('express');
const session      = require('express-session');
const bodyParser   = require('body-parser');
const responseTime = require('response-time');
const cookieParser = require('cookie-parser');

// Require class dependencies
const RedisStore = require('connect-redis')(session);

// Require local dependencies
const config = require('config');
const eden   = require('eden');

// Require helpers
const aclHelper = helper('user/acl');

// Require cache
const routes  = cache('routes');
const classes = cache('classes');

// Require Eden dependencies
const view = require('./view');

/**
 * Create Router class
 */
class Router {
  /**
   * Construct Router class
   */
  constructor() {
    // Set variables
    this.app = null;
    this.server = null;
    this.multer = null;
    this.router = null;

    // Bind methods
    this.build = this.build.bind(this);

    // Bind private methods
    this._api = this._api.bind(this);
    this._view = this._view.bind(this);
    this._error = this._error.bind(this);
    this._default = this._default.bind(this);

    // Bind super private methods
    this.__error = this.__error.bind(this);
    this.__rotue = this.__route.bind(this);
    this.__upload = this.__upload.bind(this);

    // Run build
    this.build();
  }

  /**
   * Build Router
   *
   * @async
   */
  async build() {
    // Log building to debug
    eden.logger.log('debug', 'Building', {
      class : 'Express',
    });

    // Set express
    this.app = express();

    // Set port
    this.app.set('port', eden.port);

    // Create server
    this.server = http.createServer(this.app);

    // Listen to port
    this.server.listen(eden.port, eden.host);

    // Set server event handlers
    this.server.on('error', this.__error);

    // Set multer
    this.multer = multer(config.get('upload') || {
      dest : '/tmp',
    });

    // Loop HTTP request types
    ['use', 'get', 'post', 'push', 'delete', 'all'].forEach((type) => {
      // Create HTTP request method
      this[type] = (...typeArgs) => {
        // Call express HTTP request method
        this.app[type](...typeArgs);
      };
    });

    // Set express build methods
    const methods = ['_default', '_api', '_view', '_router', '_error'];

    // Loop methods
    for (let i = 0; i < methods.length; i += 1) {
      // Run express build method
      await this[methods[i]](this.app);
    }

    // Log built to debug
    eden.logger.log('debug', 'Building completed', {
      class : 'express',
    });
  }

  /**
   * Adds defaults to given express app
   *
   * @param {express} app
   *
   * @private
   *
   * @async
   */
  async _default(app) {
    // Add request middleware
    app.use((req, res, next) => {
      // Set header
      res.header('X-Powered-By', 'EdenFrame');

      // Set isJSON request
      const isJSON = (req.headers.accept || req.headers.Accept || '').includes('application/json');
      req.isJSON = isJSON;
      res.isJSON = isJSON;
      res.locals.isJSON = isJSON;

      // Set url
      res.locals.url = req.originalUrl;

      // Check is JSON
      if (res.isJSON) {
        // Set header
        res.header('Content-Type', 'application/json');
      } else {
        // Set header
        res.header('Link', [
          `<${config.get('cdn.url') || '/'}public/css/app.min.css${config.get('version') ? `?v=${config.get('version')}` : ''}>; rel=preload; as=style`,
          `<${config.get('cdn.url') || '/'}public/js/app.min.js${config.get('version') ? `?v=${config.get('version')}` : ''}>; rel=preload; as=script`,
        ].join(','));
      }

      // Set route timer start
      res.locals.timer = {
        start : new Date().getTime(),
      };

      // Set locals response and page
      res.locals.res = res;
      res.locals.page = {};

      // Run next
      next();
    });

    // Add express middleware
    app.use(responseTime());
    app.use(cookieParser(config.get('secret')));
    app.use(bodyParser.json({
      limit : config.get('upload.limit') || '50mb',
    }));
    app.use(bodyParser.urlencoded({
      limit    : config.get('upload.limit') || '50mb',
      extended : true,
    }));
    app.use(express.static(`${global.appRoot}/data/www`));
    app.use(session({
      key    : config.get('session.key') || 'eden.session.id',
      store  : new RedisStore(config.get('redis')),
      secret : config.get('secret'),
      resave : true,
      cookie : config.get('session.cookie') || {
        secure   : false,
        httpOnly : false,
      },
      proxy             : true,
      saveUninitialized : true,
    }));

    // Run eden app hook
    await eden.hook('eden.app', app);
  }

  /**
   * Api functionality
   *
   * @param {express} app
   *
   * @private
   */
  _api(app) {
    // Set on all api routes
    app.all('/api/*', (req, res, next) => {
      // Set headers
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

      // Run next
      next();
    });
  }

  /**
   * View engine
   *
   * @param {express} app
   *
   * @private
   */
  _view(app) {
    // Set view engine
    app.set('views', `${global.appRoot}/data/cache/views`);
    app.set('view engine', 'tag');

    // Do view engine
    app.engine('tag', view.render);
  }

  /**
   * Build router
   *
   * @param {express} app
   *
   * @private
   *
   * @async
   */
  async _router(app) {
    // Create express router
    this.router = new express.Router();

    // Set router classes
    const routerClasses = Object.keys(classes).map(key => classes[key]).filter((c) => {
      // check thread
      return c.thread === eden.label || !c.thread;
    });

    // Run eden classes hook
    await eden.hook('eden.classes', routerClasses);

    // Sort router classes
    routerClasses.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Loop router classes
    for (let a = 0; a < routerClasses.length; a += 1) {
      // Load controller
      await eden.controller(routerClasses[a].file);
    }

    // Run eden routes hook
    await eden.hook('eden.routes', routes);

    // Sort routes
    routes.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Loop routes
    for (let i = 0; i < routes.length; i += 1) {
      // Run route
      await this.__route(routes[i]);
    }

    // Use router on route
    app.use('/', this.router);
  }

  /**
   * Use error handler
   *
   * @param {express} app
   *
   * @private
   */
  _error(app) {
    // Use 404 handler
    app.use((req, res) => {
      // Set status 404
      res.status(404);

      // Render 404 page
      res.render('error', {
        message : '404 page not found',
      });
    });
  }

  /**
   * Creates route
   *
   * @param {object} route
   *
   * @private
   *
   * @async
   */
  async __route(route) {
    // Set path
    let { path } = route;

    // Add to path
    path = path.length > 1 ? path.replace(/\/$/, '') : path;

    // Create route arguements
    const args = [path];

    // Run route args hook
    await eden.hook('route.args', {
      args,
      path,
      route,
    });

    // Push timer arg
    args.push((req, res, next) => {
      // Set route timer
      res.locals.timer.route = new Date().getTime();

      // Run next
      next();
    });

    // Check upload
    const upload = this.__upload(route);

    // Push upload to args
    if (upload) args.push(upload);

    // Add actual route
    args.push(async (req, res, next) => {
      // Set route
      res.locals.path = path;

      // Set route
      res.locals.route = route;

      // Set title
      if (route.title) req.title(route.title);

      // Run acl middleware
      const aclCheck = await aclHelper.middleware(req, res);

      // Alter render function
      const { render } = res;

      // Create new render function
      res.render = (...renderArgs) => {
        // Load view
        if (typeof renderArgs[0] !== 'string' && route.view) {
          // UnShift Array
          renderArgs.unshift(route.view);
        }

        // Apply to render
        render.apply(res, renderArgs);
      };

      // Check acl result
      if (aclCheck === 0) {
        // Run next
        return next();
      } if (aclCheck === 2) {
        // Return
        return null;
      }

      // Try catch
      try {
        // Get controller
        const controller = await eden.controller(route.file);

        // Try run controller function
        return controller[route.fn](req, res, next);
      } catch (e) {
        // Set error
        eden.error(e);

        // Run next
        return next();
      }
    });

    // Call router function
    this.router[route.method](...args);
  }

  /**
   * Upload method check
   *
   * @param   {object} route
   *
   * @returns {*}
   *
   * @private
   */
  __upload(route) {
    // Add upload middleware
    if (route.method !== 'post') return false;

    // Set type
    const upType = (route.upload && route.upload.type) || 'array';

    // Set middle
    let upApply = [];

    // Check type
    if (route.upload && route.upload.fields) {
      if (upType === 'array') {
        // Push name array
        upApply.push(route.upload.fields.name);
      } else if (upType === 'single') {
        // Push single name
        upApply.push(route.upload.fields[0].name);
      } else if (upType === 'fields') {
        // Push fields
        upApply = route.upload.fields;
      }
    }

    // Check if any
    if (upType === 'any') upApply = [];

    // Create upload middleware
    return this.multer[upType](...upApply);
  }

  /**
   * On error function
   *
   * @param {Error} error
   */
  __error(error) {
    // Check syscall
    if (error.syscall !== 'listen') {
      // Throw error
      eden.error(error);
    }

    // Set bind
    const bind = typeof this.port === 'string' ? `Pipe ${this.port}` : `Port ${this.port}`;

    // Check error code
    if (error.code === 'EACCES') {
      // Log access error to error
      eden.logger.log('error', `${bind} requires elevated privileges`, {
        class : 'Eden',
      });

      // Exit process
      process.exit(1);
    } else if (error.code === 'EADDRINUSE') {
      // Log address in use to error
      eden.logger.log('error', `${bind} is already in use`, {
        class : 'Eden',
      });

      // Exit
      process.exit(1);
    } else {
      // Throw error with eden
      eden.error(error);
    }
  }
}

/**
 * Export Router class
 *
 * @type {Router}
 */
module.exports = Router;
