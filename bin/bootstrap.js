/**
 * Created by Awesome on 1/30/2016.
 */

// use strict
'use strict';

// require dependencies
var os           = require ('os');
var path         = require ('path');
var http         = require ('http');
var child        = require ('child_process');
var debug        = require ('debug');
var colors       = require ('colors');
var express      = require ('express');
var cookieParser = require ('cookie-parser');
var bodyParser   = require ('body-parser');
var mongorito    = require ('mongorito');
var session      = require ('express-session');
var RedisStore   = require ('connect-redis') (session);
var portastic    = require ('portastic');

// require local dependencies
var view     = require (global.appRoot + '/bin/view');
var config   = require (global.appRoot + '/config');
var compiled = require (global.appRoot + '/cache/config.json');

/**
 * build bootstrap class
 */
class bootstrap {
    /**
     * construct bootstrap class
     */
    constructor () {
        // bind variables
        this.app      = false;
        this.debugger = false;
        this.port     = false;
        this.server   = false;
        this.router   = false;

        // bind private variables
        this._ctrl   = {};

        // bind methods
        this.onError  = this.onError.bind (this);
        this.onListen = this.onListen.bind (this);

        // bind private methods
        this._getPort = this._getPort.bind (this);

        // bind registration methods
        this._register = [
            '_registerDebugger',
            '_registerDatabase'
        ];

        // bind and run register methods
        for (var i = 0; i < this._register.length; i ++) {
            this[this._register[i]] = this[this._register[i]].bind (this);
            this[this._register[i]] ();
        }

        // bind build methods
        this._build = [
            '_buildApp',
            '_buildLocals',
            '_buildServer',
            '_buildView',
            '_buildRouter',
            '_buildErrorHandler'
        ];

        // build app and server
        this._getPort ().then (() => {
            for (var i = 0; i < this._build.length; i ++) {
                this[this._build[i]] = this[this._build[i]].bind (this);
                this[this._build[i]] ();
            }

            // server events
            this.server.on ('error', this.onError);
            this.server.on ('listening', this.onListen);
        });
    }

    /*
     * REGISTER FUNCTIONS
     */

    /**
     * registers server debugger
     *
     * @private
     */
    _registerDebugger () {
        this.debugger = debug ('EdenFrame:server');
    }

    /**
     * registers mongodb database
     *
     * @private
     */
    _registerDatabase () {
        this.database = mongorito.connect (config.database[config.environment].host + '/' + config.database[config.environment].db);
    }

    /*
     * GET FUNCTIONS
     */

    /**
     * registers port
     *
     * @private
     */
    _getPort () {
        var that   = this;
        var length = config.threads ? config.threads : os.cpus ().length;
        var start  = parseInt ((process.env.PORT || config.port), 10);
        var end    = start + (length - 1);

        return new Promise ((resolve, reject) => {
            // find port
            portastic.find ({
                'min' : start,
                'max' : end
            }).then (ports => {
                // check if available port or exit
                if (!ports.length) {
                    process.exit();
                }

                // set port
                that.port = ports[0];

                // resolve
                resolve (that.port);

                // log
                that._log ('using port ' + that.port, 'bootstrap');
            });
        });
    }

    /*
     * BUILD FUNCTIONS
     */

    /**
     * builds app
     *
     * @private
     */
    _buildApp () {
        // create express app
        this.app = (this.app ? this.app : express ());

        // set port
        this.app.set ('port', this.port);

        // set default uses
        this.app.use (bodyParser.json ());
        this.app.use (bodyParser.urlencoded ({extended : true}));
        this.app.use (cookieParser (config.session));
        this.app.use (session ({
            store : new RedisStore (), secret : config.session, resave : false, saveUninitialized : true
        }));

        // set default locals
        this.app.use ((req, res, next) => {
            // set headers
            res.header ('X-Powered-By', 'EdenFrame');

            // set variables
            res.locals.route = req.originalUrl;

            // go to next
            next ();
        });

        // set CORS on api
        this.app.all ('/api/*', (req, res, next) => {
            // set headers
            res.header ('Access-Control-Allow-Origin', '*');
            res.header ('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

            // go to next
            next ();
        });
    }

    /**
     * builds local variables
     *
     * @private
     */
    _buildLocals () {
        this.app.locals.title = config.title;
    }

    /**
     * builds app server
     *
     * @private
     */
    _buildServer () {
        // create http server
        this.server = (this.server ? this.server : http.createServer (this.app));

        // set port
        this.server.listen (this.port);
    }

    /**
     * builds view engine
     *
     * @private
     */
    _buildView () {
        // build view engine
        this.app.set ('views', global.appRoot + '/cache/view');
        this.app.set ('view engine', 'hbs');
        this.app.engine ('hbs', new view().engine);
    }

    /**
     * router
     *
     * @private
     */
    _buildRouter () {
        // set variables
        var that   = this;
        var routes = compiled.routes;

        // build router
        this.router = (this.router ? this.router : express.Router ());
        // empty controller register
        this._ctrl = {};

        // sort priorities
        var priorities = Object.keys (routes).sort ();

        // loop priorities
        for (var i = 0; i < priorities.length; i ++) {
            let types = routes[priorities[i]];

            for (var type in types) {
                let routeType = types[type];

                // loop for routes
                for (var route in routeType) {
                    // check if controller registered
                    if (! that._ctrl[routeType[route]['controller']]) {
                        // require controller
                        var ctrl = require (global.appRoot + routeType[route]['controller']);
                        // register controller
                        that._ctrl[routeType[route]['controller']] = new ctrl (this.app);
                    }

                    // assign route to controller function
                    that.router[type] (route, that._ctrl[routeType[route]['controller']][routeType[route]['action']]);
                }
            }
        }

        // set routes to app
        this.app.use ('/', this.router);
    }

    /**
     * builds error handler
     *
     * @private
     */
    _buildErrorHandler () {
        // 404 error handler
        this.app.use (function (req, res, next) {
            var err    = new Error ('Not Found');
            err.status = 404;
            next (err);
        });

        // 500 error handler
        this.app.use (function (err, req, res, next) {
            res.status (err.status || 500);
            res.render ('error', {
                message : err.message, error : {}
            });
        });
    }

    /*
     * EVENT FUNCTIONS
     */

    /**
     * on error function
     *
     * @param error
     */
    onError (error) {
        if (error.syscall !== 'listen') {
            throw error;
        }

        // bind check
        var bind = typeof this.port === 'string' ? 'Pipe ' + this.port : 'Port ' + this.port;

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                console.error (bind + ' requires elevated privileges');
                process.exit (1);
                break;
            case 'EADDRINUSE':
                console.error (bind + ' is already in use');
                process.exit (1);
                break;
            default:
                throw error;
        }
    }

    /**
     * on listen function
     */
    onListen () {
        var addr = this.server.address ();
        var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
        this.debugger ('Listening on ' + bind);
    }

    /**
     * console logs
     *
     * @param message
     * @param type
     * @private
     */
    _log (message, type, error) {
        return global.log (message, type, error);
    }
}

/**
 * export bootstrap bootstrap
 *
 * @type {bootstrap}
 */
module.exports = new bootstrap ();