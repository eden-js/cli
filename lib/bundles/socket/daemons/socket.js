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
    this.io       = false;
    this.index    = 0;
    this.users    = {};
    this.sockets  = {};
    this.threads  = {};
    this.sessions = {};

    // bind methods
    this.build  = this.build.bind (this);
    this.socket = this.socket.bind (this);

    // bind private methods
    this._emit        = this._emit.bind (this);
    this._user        = this._user.bind (this);
    this._count       = this._count.bind (this);
    this._session     = this._session.bind (this);
    this._endpoint    = this._endpoint.bind (this);
    this._connections = this._connections.bind (this);

    // build
    if (config.socket) this.build ();
  }

  /**
   * build chat daemon
   */
  build () {
    // set io
    this.io = socketio (this.eden.server);

    // setup redis conn
    var conn = config.redis || {};

    // add key
    conn.key = config.domain + ':socket';

    // set redis adapter
    this.io.adapter (redis (conn));

    // use passport auth
    this.io.use (passport.authorize ({
      key          : config.session.key || 'eden.session.id',
      store        : new redisStore (config.redis || {}),
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

    // listen for global event for emit
    this.eden.on ('socket:emit', this._emit);

    // listen for global event for room
    this.eden.on ('socket:room', this._emit);

    // listen for global event for user
    this.eden.on ('socket:user', this._user, true);

    // listen for global event for key
    this.eden.on ('socket:session', this._session);

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

    // set session id
    let session = socket.request.cookie[config.session.key || 'eden.session.id'];

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

    // add session to socket id
    if (!this.sessions[session]) {
      // create array
      this.sessions[session] = [];
    }

    // add socketid to sessions
    this.sessions[session].push (socketid);

    // send connection information
    this.eden.emit ('socket:connect', {
      'id'   : socketid,
      'key'  : session,
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

      // set index
      var index = 0;

      // remove socket id from user
      if (User && this.users[User.get ('_id').toString ()]) {
        // get index
        index = this.users[User.get ('_id').toString ()].indexOf (socketid);

        // remove user from sockets
        if (index > -1) {
          this.users[User.get ('_id').toString ()].splice (index, 1);
        }

        // check if length
        if (!this.users[User.get ('_id').toString ()].length) delete this.users[User.get ('_id').toString ()];
      }

      // remove from sessions
      if (this.sessions[session]) {
        // get index
        index = this.sessions[session].indexOf (socketid);

        // remove session from sessions
        if (index > -1) {
          this.sessions[session].splice (index, 1);
        }

        // check if length
        if (!this.sessions[session].length) delete this.sessions[session];
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
   * emit to socket funciton
   *
   * @param {Object} data
   */
  _emit (data) {
    // check if room
    if (data.room) {
      // emit to room
      this.io.to (data.room).emit (data.type, data.data);
    } else {
      // emit to everyone
      this.io.emit (data.type, data.data);
    }
  }

  /**
   * emit to user
   *
   * @param {String} channel
   * @param {Object} data
   */
  _user (channel, data) {
    // check data.to
    if (!data.to) return;

    // loop all user socket connections
    if (this.users[data.to]) {
      for (var i = 0; i < this.users[data.to].length; i++) {
        // set socket
        var Socket = this.sockets[this.users[data.to][i]];

        // check if socket
        if (!Socket) continue;

        // emit to socket
        Socket.emit (data.type, data.data);

        // emit to eden
        this.eden.emit ('socket:user:sent', data.data);
      }
    }
  }

  /**
   * emit to user
   *
   * @param {Object} data
   */
  _session (data) {
    // check data.to
    if (!data.session)  return;

    // loop all user socket connections
    if (this.sessions[data.session]) {
      for (var i = 0; i < this.sessions[data.session].length; i++) {
        // set socket
        var Socket = this.sockets[this.sessions[data.session][i]];

        // check socket exists
        if (!Socket) continue;

        // emit to socket
        Socket.emit (data.type, data.data);

        // emit to eden
        this.eden.emit ('socket:session:sent', data.data);
      }
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
