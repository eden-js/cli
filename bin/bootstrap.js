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
var RedisStore   = require ('connect-redis')(session);
var portastic    = require ('portastic');

// set global variables
global.appRoot = path.dirname (path.resolve (__dirname));

// require local dependencies
var config   = require (global.appRoot + '/config');
var view     = require (global.appRoot + '/bin/view');
var compiled = require (global.appRoot + '/cache/config.json');
var daemons  = require (global.appRoot + '/cache/daemons.json');

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
        this._daemon = {};

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
            '_buildDaemon',
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
                // set port
                that.port = ports[0];

                // resolve
                resolve (true);

                // log
                that._log('Found port ' + that.port);
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
        this.app.use (bodyParser.urlencoded ({extended : false}));
        this.app.use (cookieParser (config.session));
        this.app.use (session ({
            store             : new RedisStore(),
            secret            : config.session,
            resave            : false,
            saveUninitialized : true
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
        this.app.engine ('hbs', view);
        this.app.enable ('view cache');
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
     * build daemon
     *
     * @private
     */
    _buildDaemon () {
        // set that variable
        var that = this;
        var test = parseInt ((process.env.PORT || config.port), 10);

        // check if first process
        if (that.port !== test) {
            return;
        }

        // empty daemon register
        this._daemon = {};

        // loop daemons
        for (var key in daemons) {
            // run daemon
            var name   = daemons[key].split(path.sep);
                name   = name[(name.length - 1)];
            let daemon = name;

            // log daemon
            this._log ('starting daemon ' + daemons[key], 'Daemon');

            // set daemon fork
            this._daemon[daemon] = child.fork (global.appRoot + daemons[key]);

            // on message
            this._daemon[daemon].on('message', m => {
                that._log(m, daemon);
            });

            // on exit
            this._daemon[daemon].on('close', (code) => {
                // fork new daemon
                that._daemon[daemon] = child.fork (global.appRoot + daemons[key]);
            });
        }
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
    _log (message, type) {
        // set date and date padding
        var d = new Date();
        var p = '00';

        // set timestamp strings
        var h = d.getHours() + '';
            h = (h.substring(0, p.length - h.length) + h);
        var m = d.getMinutes() + '';
            m = (m.substring(0, p.length - m.length) + m);
        var s = d.getSeconds() + '';
            s = (s.substring(0, p.length - s.length) + s);

        // set time
        var t = '[' + colors.grey(h + ':' + m + ':' + s) + ']';
        // set framework stamp
        var f = '[' + colors.cyan('EdenFrame') + ']';
        // set type stamp
        var y = (type ? (' [' + colors.green(type) + ']') : '');

        // actually log
        console.log(t + ' ' + f + y + ' ' + message);
    }
}

/**
 * export bootstrap bootstrap
 *
 * @type {bootstrap}
 */
module.exports = new bootstrap ();