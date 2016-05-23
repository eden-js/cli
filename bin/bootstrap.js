/**
 * Created by Awesome on 1/30/2016.
 */

// use strict
'use strict';

// require dependencies
var co           = require ('co');
var os           = require ('os');
var path         = require ('path');
var http         = require ('http');
var alias        = require ('alias-module');
var child        = require ('child_process');
var colors       = require ('colors');
var session      = require ('express-session');
var express      = require ('express');
var portastic    = require ('portastic');
var mongorito    = require ('mongorito');
var bodyParser   = require ('body-parser');
var redisStore   = require ('connect-redis') (session);
var prettyError  = require ('pretty-error');
var cookieParser = require ('cookie-parser');

// require local dependencies
var view     = require (global.appRoot + '/bin/util/view');
var config   = require (global.appRoot + '/config');
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
        this.app    = false;
        this.port   = false;
        this.server = false;
        this.router = false;

        // bind private variables
        this._ctrl   = {};
        this._daemon = {};

        // bind methods
        this.onError  = this.onError.bind (this);
        this.onListen = this.onListen.bind (this);

        // bind private methods
        this._require = this._require.bind (this);
        this._getPort = this._getPort.bind (this);

        // bind registration methods
        this._register = [
            '_registerDatabase',
            '_registerAliases'
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
            '_buildErrorHandler',
            '_buildDaemons'
        ];

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
     * registers mongodb database
     *
     * @private
     */
    _registerDatabase () {
        this.database = mongorito.connect (config.database[config.environment].host + '/' + config.database[config.environment].db);
    }

    /**
     * registers node module aliases
     *
     * @private
     */
    _registerAliases () {
        // register util aliases
        alias ('acl', global.appRoot + '/bin/util/acl.js');
        alias ('log', global.appRoot + '/bin/util/log.js');

        // register core aliases
        alias ('config',     global.appRoot + '/config.js');
        alias ('command',    global.appRoot + '/bin/bundles/core/command.js');
        alias ('controller', global.appRoot + '/bin/bundles/core/controller.js');
        alias ('daemon',     global.appRoot + '/bin/bundles/core/daemon.js');
        alias ('helper',     global.appRoot + '/bin/bundles/core/helper.js');
        alias ('model',      global.appRoot + '/bin/bundles/core/model.js');

        // register alt-core aliases
        alias ('socketHelper', global.appRoot + '/bin/bundles/socket/helper/socket');
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
        // create express app
        this.app = (this.app ? this.app : express ());

        // set port
        this.app.set ('port', this.port);

        // set default uses
        this.app.use (bodyParser.json ());
        this.app.use (bodyParser.urlencoded ({extended : true}));
        this.app.use (cookieParser (config.session));
        this.app.use (express.static('www'));
        this.app.use (session ({
            store             : new redisStore (),
            secret            : config.session,
            resave            : false,
            saveUninitialized : true,
            key               : 'eden.session.id',
            cookie            : {
                httpOnly : false,
                secure   : false
            }
        }));

        // set default locals
        this.app.use ((req, res, next) => {
            // set headers
            res.header ('X-Powered-By', 'EdenFrame');

            // set variables
            res.locals.eden  = {
                'domain' : config.domain
            };
            res.locals.route = req.originalUrl;

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
    }

    /**
     * builds local variables
     *
     * @private
     */
    _buildLocals () {
        // set locals
        this.app.locals.title  = config.title;
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
        this.app.engine ('hbs', new view ().engine);
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

        // run generator
        co (function * () {
            // loop priorities
            for (var i = 0; i < priorities.length; i ++) {
                // let types
                let types = routes[priorities[i]];

                for (var type in types) {
                    // let route type
                    let routeType = types[type];

                    // loop for routes
                    for (var route in routeType) {
                        // check if controller registered
                        if (!that._ctrl[routeType[route].controller]) {
                            // require controller
                            var ctrl = yield that._require (global.appRoot + routeType[route].controller);

                            // register controller
                            that._ctrl[routeType[route].controller] = new ctrl (that.app);
                        }

                        // assign route to controller function
                        that.router[type] (route, that._ctrl[routeType[route].controller][routeType[route].action]);
                    }
                }
            }

            // set routes to app
            that.app.use ('/', that.router);

            // use 404 handler
            this.app.use ((req, res, next) => {
                // create error
                var err    = new Error ('Not Found');
                // set status
                err.status = 404;
                // next route
                next (err);
            });
        });
    }

    /**
     * builds error handler
     *
     * @private
     */
    _buildErrorHandler () {

        // 500 error handler
        this.app.use ((err, req, res, next) => {
            // set status
            res.status (err.status || 500);

            // log error
            var pe = new prettyError ();
            // log error
            console.log (pe.render (err));

            // render error page
            res.render ('error', {
                message : err.message,
                error : {}
            });
        });
    }

    /**
     * builds daemons
     */
    _buildDaemons () {
        // set that
        var that = this;

        // run generator
        co (function * () {
            for (var i = 0; i < daemons.length; i++) {
                // require daemon
                var daemon = yield that._require (global.appRoot + daemons[i]);

                // run daemon
                that._daemon[daemons[i]] = new daemon (that.app, that.server, that._ctrl);

                // log daemon
                that._log ('running', that._daemon[daemons[i]].constructor.name);
            }
        });
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
    _getPort () {
        // set variables
        var length = config.threads ? config.threads : os.cpus ().length;
        var start  = parseInt ((process.env.PORT || config.port), 10);
        var end    = start + (length - 1);

        // return promise
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
                this.port = ports[0];

                // log port
                this._log ('using port ' + this.port, 'bootstrap');

                // resolve
                resolve (this.port);
            });
        });
    }

    ////////////////////////////////////////////////////////////////////////////
    //
    //  Event Functions
    //
    ////////////////////////////////////////////////////////////////////////////

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
     * @param  {String} file
     *
     * @private
     * @return {Promise}
     */
    _require (file) {
        // return Promise
        return new Promise ((resolve, reject) => {
            // try catch
            try {
                // try require
                var req = require (file);

                // resolve
                resolve (req);
            } catch (e) {
                // log error
                var pe = new prettyError ();
                // log error
                console.log (pe.render (e));

                // exit process
                process.exit ();
            }
        });
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
