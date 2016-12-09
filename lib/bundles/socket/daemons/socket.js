/**
 * Created by Awesome on 3/7/2016.
 */

// use strict
'use strict';

// require dependencies
var redis        = require ('socket.io-redis');
var daemon       = require ('daemon');
var session      = require ('express-session');
var passport     = require ('passport.socketio');
var socketio     = require ('socket.io');
var redisStore   = require ('connect-redis') (session);
var cookieParser = require ('cookie-parser');

// require local dependencies
var acl     = require ('lib/utilities/acl');
var user    = require ('user/models/user');
var config  = require ('app/config');
var sockets = require ('app/cache/sockets.json');

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
    this.index   = 0;
    this.users   = {};
    this.sockets = {};
    this.threads = {};

    // bind methods
    this.build  = this.build.bind (this);
    this.socket = this.socket.bind (this);

    // bind private methods
    this._count       = this._count.bind (this);
    this._endpoint    = this._endpoint.bind (this);
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
      key          : config.session.key || 'eden.session.id',
      store        : new redisStore (),
      secret       : config.secret,
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
    var emitFn = (data) => {
      // emit
      this.io.emit (data.type, data.data);
    };

    // setup room function
    var roomFn = (data) => {
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

            // tell everyone
            this.eden.emit ('socket:user:sent', data.data);
          }
        }
      }
    };

    // listen for global event for emit
    this.eden.on ('socket:emit', emitFn);

    // listen for global event for room
    this.eden.on ('socket:room', roomFn);

    // listen for global event for user
    this.eden.on ('socket:user', userFn, true);

    // run count
    this._count ();
  }

  /**
   * set socket object
   *
   * @param socket
   */
  socket (socket) {
    // publish connections
    this._connections ();

    // check for user
    var User = (!socket.request.user || !socket.request.user.logged_in) ? false : socket.request.user;

    // set socketid
    let socketid = this.index;

    // add to index
    this.index++;

    // log connection
    this.logger.log ('debug', 'client ' + socketid + ' - ' + (User ? User.get ('username') : 'anonymous') + ' connected', {
      'class' : 'socketDaemon'
    });

    // add socket to sockets object
    this.sockets[socketid] = socket;

    // check if user on handshake
    if (User) {
      // create users object
      if (!this.users[User.get ('_id').toString ()]) {
        this.users[User.get ('_id').toString ()] = [];
      }

      // add i to users object
      this.users[User.get ('_id').toString ()].push (socketid);
    }

    // send connection information
    this.eden.emit ('socket:connect', {
      'id'   : socketid,
      'user' : User ? User.get ('_id').toString () : false
    });

    // disconnect socket
    socket.on ('disconnect', () => {
      // log disconnected
      this.logger.log ('debug', 'client ' + socketid + ' - ' + (User ? User.get ('username') : 'anonymous') + ' disconnected', {
        'class' : 'socketDaemon'
      });

      // publish connections
      this._connections ();

      // remove socket id from user
      if (User) {
        // get index
        var index = this.users[User.get ('_id').toString ()].indexOf (socketid);

        // remove user from sockets
        if (this.users[User.get ('_id').toString ()] && index > -1) {
          this.users[User.get ('_id').toString ()].splice (index, 1);
        }
      }

      // delete socket
      delete this.sockets[socketid];
    });

    // create functions for cached config
    for (var i = 0; i < sockets.length; i++) {
      // create listener
      this._endpoint (sockets[i], socket, User);
    }
  }

   /**
    * waits for connection count
    *
    * @private
    */
  _count () {
    // on connections
    this.eden.on ('socket:connections', (channel, data) => {
      // add to count
      this.threads[data.socket] = data.count;

      // set count
      var count = 0;
      for (var key in this.threads) {
        count += this.threads[key];
      }

      // emit to channel
      this.eden.emit ('socket:count', count);
    }, true);
  }

   /**
    * creates route listener
    *
    * @param  {Object} route
    * @param  {socket} socket
    * @param  {user}   User
    */
  _endpoint (endpoint, socket, User) {
    // create socket listener
    socket.on (endpoint.name, async (data) => {
      // reload user
      if (User) User = await user.findById (User.get ('_id').toString ());

      // check if can
      if (!await acl.validate (User, endpoint.acl)) return;

      // get controller
      var controller = await this.eden.controller (endpoint.class);

      // run function
      controller[endpoint.fn] (socket, data, User);
    });
  }

   /**
    * publishes socket connection count
    *
    * @private
    */
  _connections () {
    // publish to eden
    this.eden.emit ('socket:connections', {
      'count'  : Object.keys (this.io.sockets.sockets).length,
      'socket' : this.eden.port
    }, true);
  }
}

/**
 * construct socket daemon
 *
 * @type {socket}
 */
module.exports = socket;
