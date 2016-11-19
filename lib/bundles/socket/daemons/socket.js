/**
 * Created by Awesome on 3/7/2016.
 */

// use strict
'use strict';

// require dependencies
var acl          = require ('acl');
var redis        = require ('socket.io-redis');
var daemon       = require ('daemon');
var session      = require ('express-session');
var passport     = require ('passport.socketio');
var socketio     = require ('socket.io');
var redisStore   = require ('connect-redis') (session);
var cookieParser = require ('cookie-parser');

// require local dependencies
var user   = require ('user/models/user');
var cache  = require ('app/cache/config.json');
var config = require ('app/config');

/**
 * build socket daemon
 */
class socket extends daemon {
    /**
     * construct socket daemon
     *
     * @param  {eden} eden    eden app
     */
    constructor (eden) {
        // run super
        super (eden);

        // bind variables
        this.io      = false;
        this.users   = {};
        this.sockets = {};
        this.index   = 0;

        // bind methods
        this.build  = this.build.bind (this);
        this.socket = this.socket.bind (this);

        // bind private methods
        this._ctrl        = eden._ctrl;
        this._route       = this._route.bind (this);
        this._connections = this._connections.bind (this);

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
        // set io
        this.io = socketio (this.eden.server);

        // set redis adapter
        this.io.adapter (redis ({
            'key' : config.domain + ':socket'
        }));

        // use passport auth
        this.io.use (passport.authorize ({
            key          : 'eden.session.id',
            store        : new redisStore (),
            secret       : config.session,
            cookieParser : cookieParser,
            fail         : (data, message, critical, accept) => {
                // accept connection
                accept (null, false);
            },
            success      : (data, accept) => {
                // accept
                accept (null, true);
            }
        }));

        // listen for connection
        this.io.on ('connection', this.socket);

        // setup emiti function
        var emitFn = (channel, data) => {
            // emit
            this.io.emit (data.type, data.data);
        };

        // setup room function
        var roomFn = (channel, data) => {
            // emit
            this.io.to (data.room).emit (data.type, data.data);
        };

        // setup user fn
        var userFn = (channel, data) => {
            // check data.to
            if (!data.to) {
                return;
            }

            // loop all user socket connections
            if (this.users[data.to]) {
                for (var i = 0; i < this.users[data.to].length; i++) {
                    // check socket exists
                    if (this.sockets[this.users[data.to][i]]) {
                        // emit to socket
                        this.sockets[this.users[data.to][i]].emit (data.type, data.data);
                    }
                }
            }
        };

        // listen for global event for emit
        this.eden.on ('socket:emit', emitFn);
        this.eden.on ('socket:emit', emitFn, true);

        // listen for global event for room
        this.eden.on ('socket:room', roomFn);
        this.eden.on ('socket:room', roomFn, true);

        // listen for global event for user
        this.eden.on ('socket:user', userFn);
        this.eden.on ('socket:user', userFn, true);
    }

    /**
     * set socket object
     *
     * @param socket
     */
     socket (socket) {
         // set that
         var that = this;

         // publish connections
         this._connections ();

         // check for user
         var User = (!socket.request.user || !socket.request.user.logged_in) ? false : socket.request.user;

         // set socketid
         let socketid = that.index;
         that.index++;

         // log connection
         this.logger.log ('debug', 'client ' + socketid + ' - ' + (User ? User.get ('username') : 'anonymous') + ' connected', {
             'class' : 'socketDaemon'
         });

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
             this.logger.log ('debug', 'client ' + socketid + ' - ' + (User ? User.get ('username') : 'anonymous') + ' disconnected', {
                 'class' : 'socketDaemon'
             });

             // publish connections
             that._connections ();

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
             this._route (cache.sockets[type], socket, User);
         }
     }

     /**
      * creates route listener
      *
      * @param  {Object} route
      * @param  {socket} socket
      * @param  {user}   User
      */
     _route (route, socket, User) {
         // set that
         var that = this;

         // create socket listener
         socket.on (route.type, async data => {
             // reload user
             if (User) {
                 User = await user.findById (User.get ('_id').toString ());
             }

             // check if can
             var can = await acl.test (route.acl, User);

             // return if cant
             if (can !== true) {
                 return;
             }

             // check controller exists
             if (!that._ctrl[route.controller]) {
                 // require controller
                 var ctrl = require (global.appRoot + route.controller);

                 // register controller
                 that._ctrl[route.controller] = new ctrl (that.app);
             }

             // run function
             that._ctrl[route.controller][route.socket] (socket, data, User);
         });
     }

     /**
      * publishes socket connection count
      *
      * @private
      */
     _connections () {
         // publish to eden
         this.eden.emit ('socket:connections', Object.keys (this.io.sockets.sockets).length, true);
     }
}

/**
 * construct socket daemon
 *
 * @type {socket}
 */
module.exports = socket;
