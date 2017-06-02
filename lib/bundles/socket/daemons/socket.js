
// require dependencies
const daemon       = require ('daemon');
const session      = require ('express-session');
const passport     = require ('passport.socketio');
const socketio     = require ('socket.io');
const redisStore   = require ('connect-redis') (session);
const cookieParser = require ('cookie-parser');

// require local dependencies
const acl     = require ('lib/utilities/acl');
const calls   = require ('app/cache/calls.json');
const config  = require ('config');
const sockets = require ('app/cache/sockets.json');

/**
 * build socket daemon
 *
 * @express
 */
class socket extends daemon {
  /**
   * construct socket daemon
   *
   * @param  {eden} eden    eden app
   */
  constructor () {
    // run super
    super ();

    // don't run on main thread if no server is applicable
    if (!this.eden.express) return;

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
    this._call        = this._call.bind (this);
    this._emit        = this._emit.bind (this);
    this._user        = this._user.bind (this);
    this._session     = this._session.bind (this);
    this._endpoint    = this._endpoint.bind (this);
    this._connections = this._connections.bind (this);

    // build
    if (config.get ('socket')) this.build ();
  }

  /**
   * build chat daemon
   */
  build () {
    // set io
    this.io = socketio (this.eden.router._server);

    // setup redis conn
    let conn = config.get ('redis') || {};

    // add key
    conn.key = config.get ('domain') + '.socket';

    // use passport auth
    this.io.use (passport.authorize ({
      'key'          : config.get ('session.key') || 'eden.session.id',
      'store'        : new redisStore (config.get ('redis')),
      'secret'       : config.get ('secret'),
      'cookieParser' : cookieParser,
      'fail'         : (data, message, critical, accept) => {
        // accept connection
        accept (null, false);
      },
      'success' : (data, accept) => {
        // accept
        accept (null, true);
      }
    }));

    // listen for connection
    this.io.on ('connection', this.socket);

    // listen for global event for emit
    this.eden.on ('socket.emit', this._emit, true);

    // listen for global event for room
    this.eden.on ('socket.room', this._emit, true);

    // listen for global event for user
    this.eden.on ('socket.user', this._user, true);

    // listen for global event for key
    this.eden.on ('socket.session', this._session, true);
  }

  /**
   * set socket object
   *
   * @param socket
   */
  socket (socket) {
    // publish connections
    this._connections (true);

    // check for user
    let User = (!socket.request.user || !socket.request.user.logged_in) ? false : socket.request.user;

    // set socketid
    let socketid = this.index;

    // set session id
    let session = socket.request.cookie[config.get ('session.key') || 'eden.session.id'];

    // add to index
    this.index++;

    // log connection
    this.logger.log ('debug', 'client ' + socketid + ' - ' + (User ? User.get ('username') : 'anonymous') + ' connected', {
      'class' : 'socket'
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
    this.eden.emit ('socket.connect', {
      'id'   : socketid,
      'key'  : session,
      'user' : User ? User.get ('_id').toString () : false
    });

    // disconnect socket
    socket.on ('disconnect', () => {
      // log disconnected
      this.logger.log ('debug', 'client ' + socketid + ' - ' + (User ? User.get ('username') : 'anonymous') + ' disconnected', {
        'class' : 'socket'
      });

      // publish connections
      this._connections (false);

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

    // on call
    socket.on ('eden.call', (data) => {
      // call data
      this._call (data, socket, User);
    });
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
  _user (data) {
    // check data.to
    if (!data.to) return;

    // loop all user socket connections
    if (this.users[data.to]) {
      for (var i = 0; i < this.users[data.to].length; i++) {
        // set socket
        let Socket = this.sockets[this.users[data.to][i]];

        // check if socket
        if (!Socket) continue;

        // emit to socket
        Socket.emit (data.type, data.data);

        // emit to eden
        this.eden.emit ('socket.user.sent', data.data);
      }
    }
  }

  /**
   * emit to user
   *
   * @param {String} channel
   * @param {Object} data
   */
  _session (data) {
    // check data.to
    if (!data.session)  return;

    // check session exists
    if (!this.sessions[data.session]) return;

    // loop sessions
    for (var i = 0; i < this.sessions[data.session].length; i++) {
      // set socket
      let Socket = this.sockets[this.sessions[data.session][i]];

      // check socket exists
      if (!Socket) continue;

      // emit to socket
      Socket.emit (data.type, data.data);

      // emit to eden
      this.eden.emit ('socket.session.sent', data.data);
    }
  }

  /**
   * creates route listener
   *
   * @param  {Object} route
   * @param  {socket} socket
   * @param  {user}   User
   */
  async _call (data, socket, User) {
    // reload user
    if (User) await User.refresh ();

    // loop endpoints
    let matched = calls.filter ((call) => {
      // remove call
      return data.name === call.name;
    });

    // loop matched
    for (let i = 0; i < matched.length; i++) {
      // get call
      let call = matched[i];

      // check if can
      if (!await acl.validate (User, call.acl)) continue;

      // get controller
      let controller = await this.eden.controller (call.class);

      // run endpoint
      let response = await controller[call.fn] ({
        'user'   : User,
        'call'   : data.name,
        'socket' : socket
      }, ...data.args);

      // return response
      socket.emit (data.id, response);
    }
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
      if (User) await User.refresh ();

      // check if can
      if (!await acl.validate (User, endpoint.acl)) return;

      // get controller
      let controller = await this.eden.controller (endpoint.class);

      // run function
      controller[endpoint.fn] (socket, data, User);
    });
  }

  /**
   * publishes socket connection count
   *
   * @private
   */
  async _connections (add) {
    // publish to eden
    let connections = await this.eden.get ('socket.connections');

    // add or subtract
    if (add) connections++;
    if (!add) connections--;

    // check if < 0
    if (connections < 0) connections = 0;

    // emit to channel
    this.eden.emit ('socket.connections', connections);

    // update cache
    await this.eden.set ('socket.connections', connections);
  }
}

/**
 * construct socket daemon
 *
 * @type {socket}
 */
exports = module.exports = socket;
