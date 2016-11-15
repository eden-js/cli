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
var redis        = require ('redis-eventemitter');
var events       = require ('events');
var colors       = require ('colors');
var express      = require ('express');
var session      = require ('express-session');
var winston      = require ('winston');
var portastic    = require ('portastic');
var mongorito    = require ('mongorito');
var bodyParser   = require ('body-parser');
var redisStore   = require ('connect-redis') (session);
var prettyError  = require ('pretty-error');
var responseTime = require ('response-time');
var cookieParser = require ('cookie-parser');

// require local dependencies
var log      = require ('lib/utilities/log');
var config   = require ('app/config');
var engine   = require ('lib/utilities/engine');
var daemons  = require ('app/cache/daemons.json');
var compiled = require ('app/cache/config.json');

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
            '_buildServer',
            '_buildView',
            '_buildRouter',
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
            prefix : config.domain + ':eden:',
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
        this.app = (this.app ? this.app : express ());

        // set port
        this.app.set ('port', this.port);

        // set default uses
        this.app.use (responseTime ());
        this.app.use (bodyParser.json ());
        this.app.use (bodyParser.urlencoded ({extended : true}));
        this.app.use (cookieParser (config.session));
        this.app.use (express.static ('www'));
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

        // set error handler
        this.app.use ((err, req, res, next) => {
            // set status
            res.status (err.status || 500);

            // print error
            this.error (err);

            // render error page
            res.render ('error', {
                error   : {},
                message : err.message
            });
        });

        // set default locals
        this.app.use ((req, res, next) => {
            // set headers
            res.header ('X-Powered-By', 'EdenFrame');

            // set variables
            res.locals.route  = req.originalUrl.replace ('ajx/', '');
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
     * builds app server
     *
     * @private
     */
    _buildServer () {
        // log building app
        this.logger.log ('debug', 'building app http server');

        // create http server
        this.server = (this.server ? this.server : http.createServer (this.app));

        // set port
        this.server.listen (this.port);

        // log building app
        this.logger.log ('debug', 'finished building app http server');
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
        // set variables
        var routes = compiled.routes;

        // build router
        this.router = (this.router ? this.router : express.Router ());

        // empty controller register
        this._ctrl = {};

        // sort priorities
        var priorities = Object.keys (routes).sort ();

        // require user controller first
        var userCtrl = '/lib/bundles/user/controllers/main';
        var UserCtrl = await this.require (global.appRoot + userCtrl);

        // build required user controller
        this._ctrl[userCtrl] = new UserCtrl (this);

        // loop priorities
        for (var i = 0; i < priorities.length; i ++) {
            // let types
            let types = routes[priorities[i]];

            for (var type in types) {
                // let route type
                let routeType = types[type];

                // loop for routes
                for (var route in routeType) {
                    // await controller
                    var ctrl = await this.controller (routeType[route].controller);

                    // assign route to controller function
                    this.router[type] (route, ctrl[routeType[route].action]);
                }
            }
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
        // set that
        var that = this;

        // loop daemons
        for (var i = 0; i < daemons.length; i++) {
            // require daemon
            var daemon = await that.require (global.appRoot + daemons[i]);

            // run daemon
            try {
                that._daemon[daemons[i]] = new daemon (that);

                // log daemon
                that.logger.log ('info', 'running daemon ' + that._daemon[daemons[i]].constructor.name);
            } catch (e) {
                // print error
                that.error (e);

                // log daemon
                that.logger.log ('error', 'daemon ' + that._daemon[daemons[i]].constructor.name + ' failed!');
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
        // set variables
        var length = config.threads ? config.threads : os.cpus ().length;
        var start  = parseInt ((process.env.PORT || config.port), 10);
        var end    = start + (length - 1);

        // return promise
        var ports = await portastic.find ({
            'min' : start,
            'max' : end
        });
        console.log (ports);

        // check if available port or exit
        if (!ports.length) {
            process.exit ();
        }

        // set port
        this.port = ports[0];

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
        // set that
        var that = this;

        // try catch
        try {
            // check if controller registered
            if (!that._ctrl[file]) {
                // require controller
                var ctrl = await that.require (global.appRoot + file);

                // register controller
                that._ctrl[file] = new ctrl (this);
            }

            // resolve
            return that._ctrl[file];
        } catch (e) {
            // print error
            that.error (e);

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
