// Require dependencies
import eden from 'eden';
import sirv from 'sirv';
import polka from 'polka';
import config from 'config';
import multer from 'multer';
import session from 'express-session';
import redirect from '@polka/redirect';
import bodyParser from 'body-parser';
import polkaCompat from 'polka-compat';
import responseTime from 'response-time';
import cookieParser from 'cookie-parser';
import SessionStore from '@edenjs/session-store';
import { v4 as uuid } from 'uuid';

// Require helpers
const aclHelper = helper('user/acl');

// Require cache
const routes  = cache('routes');
const classes = cache('classes');

// Require Eden dependencies
import view from './view';

/**
 * Create Router class
 */
export default class EdenRouter {
  /**
   * Construct Router class
   */
  constructor() {
    // Set variables
    this.app = null;
    this.multer = null;

    // Bind methods
    this.build = this.build.bind(this);

    // Bind private methods
    this.apiAction = this.apiAction.bind(this);
    this.initAction = this.initAction.bind(this);
    this.errorAction = this.errorAction.bind(this);

    // Bind super private methods
    this.buildRoute = this.buildRoute.bind(this);
    this.buildUpload = this.buildUpload.bind(this);

    // Run build
    this.building = this.build();
  }


  // /////////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Build Methods
  //
  // /////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Build Router
   *
   * @async
   */
  async build() {
    // Log building to debug
    eden.logger.log('debug', 'building eden router', {
      class : this.constructor.name,
    });

    // create app
    this.app = polka({
      onError : this.errorAction
    });

    // create express app
    await eden.hook('eden.router.app', this.app, () => {
      // Create server
      return this.app.listen(eden.port);
    });

    // Log built to debug
    eden.logger.log('info', `[${eden.port}] [${eden.host}] server listening`, {
      class : this.constructor.name,
    });

    // Set multer
    this.multer = multer(config.get('upload') || {
      dest : '/tmp',
    });

    // hook multer
    await eden.hook('eden.router.multer', this.multer);

    // Loop HTTP request types
    ['use', 'get', 'post', 'push', 'delete', 'all'].forEach((type) => {
      // Create HTTP request method
      this[type] = (...typeArgs) => {
        // Call express HTTP request method
        this.app[type](...typeArgs);
      };
    });

    // create initial route
    this.app.use(polkaCompat());
    this.app.use(this.initAction);
    this.app.use('api', this.apiAction);

    // Run eden app hook
    await eden.hook('eden.app', this.app, () => {
      // initialize
      SessionStore.initialize(session);

      // Add express middleware
      this.app.use(responseTime());
      this.app.use(cookieParser(config.get('secret')));
      this.app.use(bodyParser.json({
        limit : config.get('upload.limit') || '50mb',
      }));
      this.app.use(bodyParser.urlencoded({
        limit    : config.get('upload.limit') || '50mb',
        extended : true,
      }));
      this.app.use(sirv(`${global.appRoot}/www`, {
        maxAge : config.get('cache.age') || 31536000, // 1Y
      }));
      this.app.use(session({
        key   : config.get('session.key') || 'eden.session.id',
        genid : uuid,
        store : new SessionStore({
          eden,
        }),
        secret : config.get('secret'),
        resave : true,
        cookie : config.get('session.cookie') || {
          maxAge   : (24 * 60 * 60 * 1000),
          secure   : false,
          httpOnly : false,
        },
        proxy             : true,
        saveUninitialized : true,
      }));
    });
    
    // Set router classes
    const controllers = Object.values(classes).filter((c) => {
      // check thread
      return !c.cluster || c.cluster.includes(eden.label);
    }).sort((a, b) => {
      if ((b.priority || 0) > (a.priority || 0)) return 1;
      if ((b.priority || 0) < (a.priority || 0)) return -1;

      return 0;
    });

    // Run eden routes hook
    await eden.hook('eden.router.controllers', controllers, async () => {
      // Loop router classes
      for (const controller of controllers) {
        // Load controller
        await eden.controller(controller.file);
      }
    });

    // Sort routes
    routes.sort((a, b) => {
      if ((b.priority || 0) > (a.priority || 0)) return 1;
      if ((b.priority || 0) < (a.priority || 0)) return -1;

      return 0;
    });

    // Run eden routes hook
    await eden.hook('eden.router.routes', routes, async () => {
      // create route map
      for (const route of routes) {
        // add to router
        this.app[route.method.toLowerCase()](route.path, ...(await this.buildRoute(route)));
      }
    });

    // Log built to debug
    eden.logger.log('debug', 'completed building eden router', {
      class : this.constructor.name,
    });
  }

  /**
   * builds route from eden config
   *
   * @param route 
   */
  async buildRoute(route) {
    // Set path
    let { path, method } = route;

    // no path
    if (!path || !method) return;

    // set args
    const args = [];

    // Run route args hook
    await eden.hook('eden.router.route', {
      args,
      path,
      route,
    }, async () => {
      // Check upload
      const upload = this.buildUpload(route);

      // Push upload to args
      if (upload) args.push(upload);

      // Add actual route
      args.push(async (req, res, next) => {
        // EDEN ROUTE METHOD
        req.path  = path;
        req.route = route;

        // Set title
        if (route.title) req.title(route.title);

        // Run acl middleware
        const aclCheck = await aclHelper.middleware(req, res, route);

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
    });

    // return array
    return args;
  }

  /**
   * builds upload from eden config
   *
   * @param route 
   */
  buildUpload(route) {
    // Add upload middleware
    if (route.method !== 'post') return false;

    // Set type
    const upType = (route.upload && route.upload.type) || 'array';

    // Set middle
    let upApply = [];

    // Check type
    if (route.upload && (route.upload.fields || route.upload.name)) {
      if (upType === 'array') {
        // Push name array
        upApply.push(route.upload.name);
      } else if (upType === 'single') {
        // Push single name
        upApply.push(route.upload.name);
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


  // /////////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Action Methods
  //
  // /////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * initialize eden route action
   *
   * @param req 
   * @param res 
   * @param next 
   */
  initAction(req, res, next) {
    // add headers
    req.set    = res.set = req.header = res.header = res.setHeader; // simple header set methods
    res.head   = ''; // to add to head tag
    res.foot   = ''; // to add post body tag
    res.page   = {}; // page variables
    res.style  = ''; // to add to style tag
    res.class  = ''; // body class
    res.locals = {}; // middleware variables for rendering

    // status
    res.status = (status) => {
      res.__status = status;
    };

    // replace send
    const send = res.send;
    res.send = (data, ...args) => {
      // status
      if (res.__status) {
        // send
        send(data, res.__status);
      } else {
        // send default
        send(data, ...args);
      }
    };

    // Set header
    res.header('X-Powered-By', 'EdenJS');

    // create render function
    res.render = async (...args) => {
      // set view
      if (typeof args[0] !== 'string') args.unshift(req.route.view);

      // render
      res.header('Content-Type', 'text/html; charset=utf-8');
      res.end(await view.render({ req, res, next }, ...args));
    };
    res.json = async (data) => {
      // send json
      res.header('Content-Type', 'application/json; charset=utf-8');

      // send
      res.end(JSON.stringify(data));
    };
    res.redirect = (url) => {
      redirect(res, url);
    };

    // Set isJSON request
    req.isJSON = res.isJSON = (req.headers.accept || req.headers.Accept || '').includes('application/json');

    // create timer
    req.timer = {
      start : new Date().getTime(),
      route : new Date().getTime(),
    };

    // Check is JSON
    if (req.isJSON) {
      // Set header
      res.header('Content-Type', 'application/json');
    }

    // Run next
    next();
  }

  /**
   * API action
   *
   * @param req 
   * @param res 
   * @param next 
   */
  apiAction(req, res, next) {
    // Set headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    // Run next
    next();
  }

  /**
   * Use error handler
   *
   * @param {express} app
   *
   * @private
   */
  async errorAction(err, req, res) {
    // check JSON
    if (req.isJSON) {
      // send json
      res.header('Content-Type', 'application/json; charset=utf-8');
    } else {
      // send HTML
      res.header('Content-Type', 'text/html; charset=utf-8');
    }

    // render
    res.send(await view.render({ req, res }, 'error', {
      message : err.message || '404 page not found',
    }), err.code);
  }
}
