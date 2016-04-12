/**
 * Created by Awesome on 3/7/2016.
 */

// use strict
'use strict';

// require dependencies
var redis        = require ('socket.io-redis');
var session      = require ('express-session');
var passport     = require ('passport.socketio');
var socketio     = require ('socket.io');
var redisStore   = require ('connect-redis') (session);
var redisLocal   = require ('redis');
var cookieParser = require ('cookie-parser');

// require local dependencies
var acl    = require (global.appRoot + '/bin/util/acl');
var log    = require (global.appRoot + '/bin/util/log');
var cache  = require (global.appRoot + '/cache/config.json');
var config = require (global.appRoot + '/config');
var daemon = require (global.appRoot + '/bin/bundles/core/daemon');

// conditionally create sub
var sub = false;
if (config.socket) {
    sub = redisLocal.createClient ();
}

/**
 * build socket daemon
 */
class socketDaemon extends daemon {
    /**
     * construct socket daemon
     *
     * @param  {express4} app    express app
     * @param  {Server}   server express server
     */
    constructor (app, server, ctrl) {
        // run super
        super (app, server);

        // bind variables
        this.io      = false;
        this.users   = {};
        this.sockets = {};
        this.index   = 0;

        // bind private variables
        this._ctrl = ctrl;

        // bind methods
        this.build  = this.build.bind (this);
        this.socket = this.socket.bind (this);

        // check if socket enabled;
        if (!config.socket) {
            return;
        }

        // build
        this.build ();
    }

    /**
     * build chat daemon
     */
    build () {
        // set that
        var that = this;

        // set io
        this.io = socketio (this.server);

        // set redis adapter
        this.io.adapter (redis ({
            'key' : config.domain
        }));

        // use passport auth
        this.io.use(passport.authorize ({
            cookieParser : cookieParser,
            secret       : config.session,
            store        : new redisStore (),
            key          : 'eden.session.id'
        }));

        // listen for connection
        this.io.on ('connection', this.socket);

        // check if sub
        if (!sub) {
            return;
        }

        // listen to local redis
        sub.on ('message', (channel, data) => {
            // parse data
            data = JSON.parse (data);

            // check data parsed
            if (!data) {
                return;
            }

            // check data.to
            if (!data.to) {
                return;
            }

            // loop all user socket connections
            for (var i = 0; i < that.users[data.to].length; i++) {
                // check socket exists
                if (that.sockets[that.users[data.to][i]]) {
                    // emit to socket
                    that.sockets[that.users[data.to][i]].emit (data.type, data.data);
                }
            }
        });
        // subscribe to local redis
        sub.subscribe (config.domain + ':socket-message');
    }

    /**
     * set socket object
     *
     * @param socket
     */
     socket (socket) {
         // set that
         var that = this;

         // check for user
         let User = socket.request.user || false;

         // set socketid
         let socketid = that.index;
         that.index++;

         // log connection
         log ('client ' + socketid + ' connected');

         // add socket to sockets object
         that.sockets[socketid] = socket;

         // check if user on handshake
         if (User) {
             // create users object
             if (!that.users[User.get ('_id').toString ()]) {
                 that.users[User.get ('_id').toString ()] = [];
             }
             // add i to users object
             that.users[User.get ('_id').toString ()].push (socketid);
         }

         // disconnect socket
         socket.on ('disconnect', () => {
             // log disconnected
             log ('client ' + socketid + ' disconnected');

             // remove socket id from user
             if (User) {
                 if (that.users[User.get ('_id').toString ()] && that.users[User.get ('_id').toString ()].indexOf (socketid) > -1) {
                     that.users[User.get ('_id').toString ()].splice (that.users[User.get ('_id').toString ()].indexOf (socketid), 1);
                 }
             }

             // delete socket
             delete that.sockets[socketid];
         });

         // create functions for cached config
         for (var type in cache.sockets) {
             // create listener
             this._createListener (cache.sockets[type], socket, User);
         }
     }

     /**
      * creates listener by route
      *
      * @param  {Object} route
      * @param  {socket} socket
      * @param  {user}   User
      */
     _createListener (route, socket, User) {
         // set that
         var that = this;

         // create socket listener
         socket.on (route.type, data => {
             // check if user can acl
             acl.test (route.acl, User).then (can => {
                 // check acl returned true
                 if (can === true) {
                     // check controller exists
                     if (!that._ctrl[route.controller]) {
                         // require controller
                         var ctrl = require (global.appRoot + route.controller);
                         // register controller
                         that._ctrl[route.controller] = new ctrl (that.app);
                     }

                     // run function
                     that._ctrl[route.controller][route.socket] (socket, data, User);
                 }
             });
         });
     }
}

/**
 * construct socket daemon
 *
 * @type {socketDaemon}
 */
module.exports = socketDaemon;
