/**
 * Created by Awesome on 1/30/2016.
 */

// use strict
'use strict';

// require dependencies
var path         = require('path');
var http         = require('http');
var debug        = require('debug');
var express      = require('express');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var mongorito    = require('mongorito');

// set global variables
global.appRoot = path.dirname(path.resolve(__dirname));

// require local dependencies
var config  = require(global.appRoot + '/config');
var view    = require(global.appRoot + '/bin/view');
var routes  = require(global.appRoot + '/cache/routes.json');
var daemons = require(global.appRoot + '/cache/daemons.json');

/**
 * build bootstrap class
 */
class bootstrap {
    /**
     * construct bootstrap class
     */
    constructor() {
        // bind variables
        this.app      = false;
        this.debugger = false;
        this.port     = false;
        this.server   = false;
        this.router   = false;

        // bind private variables
        this._ctrl   = {};
        this._daemon = {};

        // bind methods
        this.onError  = this.onError.bind(this);
        this.onListen = this.onListen.bind(this);

        // bind registration methods
        this._register = [
            '_registerDebugger',
            '_registerDatabase',
            '_registerPort'
        ];

        // bind and run register methods
        for (var i = 0; i < this._register.length; i++) {
            this[this._register[i]] = this[this._register[i]].bind(this);
            this[this._register[i]] ();
        }

        // bind build methods
        this._build = [
            '_buildApp',
            '_buildLocals',
            '_buildServer',
            '_buildView',
            '_buildParser',
            '_buildRouter',
            '_buildDaemon',
            '_buildErrorHandler'
        ];

        // build app and server
        for (var i = 0; i < this._build.length; i++) {
            this[this._build[i]] = this[this._build[i]].bind(this);
            this[this._build[i]] ();
        }

        // server events
        this.server.on('error', this.onError);
        this.server.on('listening', this.onListen);
    }

    /*
     * REGISTER FUNCTIONS
     */

    /**
     * registers server debugger
     *
     * @private
     */
    _registerDebugger() {
        this.debugger = debug('EdenFrame:server');
    }

    /**
     * registers mongodb database
     *
     * @private
     */
    _registerDatabase() {
        this.database = mongorito.connect(
            config.database[config.environment].host + '/' + config.database[config.environment].db
        );
    }

    /**
     * registers port
     *
     * @private
     */
    _registerPort() {
        this.port = parseInt((process.env.PORT || config.port), 10);
    }

    /*
     * BUILD FUNCTIONS
     */

    /**
     * builds app
     *
     * @private
     */
    _buildApp() {
        // create express app
        this.app = (this.app ? this.app : express());

        // set port
        this.app.set('port', this.port);

        // set default values
        this.app.use((req, res, next) => {
            // set headers
            res.header('X-Powered-By', 'EdenFrame');

            // set variables
            res.locals.route = req.originalUrl;

            // go to next
            next();
        });

        // set CORS on api
        this.app.all('/api/*', (req, res, next) => {
            // set headers
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

            // go to next
            next();
        });
    }

    /**
     * builds local variables
     *
     * @private
     */
    _buildLocals() {
        this.app.locals.title = config.title;
    }

    /**
     * builds app server
     *
     * @private
     */
    _buildServer() {
        // create http server
        this.server = (this.server ? this.server : http.createServer(this.app));

        // set port
        this.server.listen(this.port);
    }

    /**
     * builds view engine
     *
     * @private
     */
    _buildView() {
        // build view engine
        this.app.set('views', global.appRoot + '/cache/view');
        this.app.set('view engine', 'hbs');
        this.app.engine('hbs', view);
    }

    /**
     * build app parser
     *
     * @private
     */
    _buildParser() {
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({extended: false}));
        this.app.use(cookieParser());
    }

    /**
     * router
     *
     * @private
     */
    _buildRouter() {
        // build router
        this.router = (this.router ? this.router : express.Router());
        // empty controller register
        this._ctrl  = {};

        // loop routes
        for (var type in routes) {
            // loop routes with type
            for (var route in routes[type]) {
                // check if controller registered
                if (!this._ctrl[routes[type][route]['controller']]) {
                    // require controller
                    var ctrl = require(global.appRoot + routes[type][route]['controller']);
                    // register controller
                    this._ctrl[routes[type][route]['controller']] = new ctrl();
                }

                // assign route to controller function
                this.router[type](route, this._ctrl[routes[type][route]['controller']][routes[type][route]['action']]);
            }
        }

        // set routes to app
        this.app.use('/', this.router);
    }

    /**
     * build daemon
     *
     * @private
     */
    _buildDaemon() {
        // empty daemon register
        this._daemon = {};

        // loop daemons
        for (var key in daemons) {
            // require daemon
            var daemon = require(global.appRoot + daemons[key]);
            // register daemon
            this._daemon[daemons[key]] = new daemon();
        }
    }

    /**
     * builds error handler
     *
     * @private
     */
    _buildErrorHandler() {
        // 404 error handler
        this.app.use(function (req, res, next) {
            var err    = new Error('Not Found');
            err.status = 404;
            next(err);
        });

        // 500 error handler
        this.app.use(function (err, req, res, next) {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: {}
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
    onError(error) {
        if (error.syscall !== 'listen') {
            throw error;
        }

        var bind = typeof this.port === 'string'
            ? 'Pipe ' + this.port
            : 'Port ' + this.port;

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    }

    /**
     * on listen function
     */
    onListen() {
        var addr = this.server.address();
        var bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
        this.debugger('Listening on ' + bind);
    }
}

/**
 * export bootstrap bootstrap
 *
 * @type {bootstrap}
 */
module.exports = new bootstrap();