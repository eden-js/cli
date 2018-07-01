
// Require dependencies
const daemon       = require('daemon');
const session      = require('express-session');
const passport     = require('passport.socketio');
const socketio     = require('socket.io');
const redisStore   = require('connect-redis')(session);
const cookieParser = require('cookie-parser');

// Require local dependencies
const calls   = require('app/cache/calls.json');
const config  = require('config');
const sockets = require('app/cache/sockets.json');

// Require helpers
const aclHelper = helper('user/acl');

/**
 * Build socket daemon
 *
 * @express
 */
class socket extends daemon {

  /**
   * Construct socket daemon
   */
  constructor () {
    // Run super
    super(...arguments);

    // Don't run on main thread if no server is applicable
    if (!this.eden.express) return;

    // Bind variables
    this.io       = false;
    this.index    = 0;
    this.users    = {};
    this.sockets  = {};
    this.threads  = {};
    this.sessions = {};

    // Bind methods
    this.build  = this.build.bind(this);
    this.socket = this.socket.bind(this);

    // Bind private methods
    this._call       = this._call.bind(this);
    this._emit       = this._emit.bind(this);
    this._user       = this._user.bind(this);
    this._session    = this._session.bind(this);
    this._endpoint   = this._endpoint.bind(this);
    this._connection = this._connection.bind(this);

    // Build
    if (config.get('socket')) this.build();
  }

  /**
   * Build chat daemon
   */
  build () {
    // Set io
    this.io = socketio(this.eden.router._server);

    // Setup redis conn
    let conn = config.get('redis') || {};

    // Add key
    conn.key = config.get('domain') + '.socket';

    // Use passport auth
    this.io.use(passport.authorize({
      'key'          : config.get('session.key') || 'eden.session.id',
      'store'        : new redisStore(config.get('redis')),
      'secret'       : config.get('secret'),
      'cookieParser' : cookieParser,
      'fail'         : (data, message, critical, accept) => {
        // Accept connection
        accept(null, false);
      },
      'success' : (data, accept) => {
        // Accept
        accept(null, true);
      }
    }));

    // Listen for connection
    this.io.on('connection', this.socket);

    // Listen for global event for emit
    this.eden.on('socket.emit', this._emit, true);

    // Listen for global event for room
    this.eden.on('socket.room', this._emit, true);

    // Listen for global event for user
    this.eden.on('socket.user', this._user, true);

    // Listen for global event for key
    this.eden.on('socket.session', this._session, true);
  }

  /**
   * Set socket object
   *
   * @param {socket} socket
   */
  socket (socket) {
    // Publish connections
    this._connection(true);

    // Check for user
    let User = (!socket.request.user || !socket.request.user.logged_in) ? false : socket.request.user;

    // Set socketid
    let socketid = this.index;

    // Set session id
    let session = socket.request.cookie[config.get('session.key') || 'eden.session.id'];

    // Add to index
    this.index++;

    // Log connection
    this.logger.log('debug', 'client ' + socketid + ' - ' + (User ? User.get('username') : 'anonymous') + ' connected', {
      'class' : 'socket'
    });

    // Add socket to sockets object
    this.sockets[socketid] = socket;

    // Check if user on handshake
    if (User) {
      // Create users object
      if (!this.users[User.get('_id').toString()]) {
        this.users[User.get('_id').toString()] = [];
      }

      // Add i to users object
      this.users[User.get('_id').toString()].push(socketid);
    }

    // Add session to socket id
    if (!this.sessions[session]) {
      // Create array
      this.sessions[session] = [];
    }

    // Add socketid to sessions
    this.sessions[session].push(socketid);

    // Send connection information
    this.eden.emit('socket.connect', {
      'id'        : socketid,
      'key'       : session,
      'user'      : User,
      'sessionID' : session
    });

    // Disconnect socket
    socket.on('disconnect', () => {
      // Log disconnected
      this.logger.log('debug', 'client ' + socketid + ' - ' + (User ? User.get('username') : 'anonymous') + ' disconnected', {
        'class' : 'socket'
      });

      // Publish connections
      this._connection(false);

      // Set index
      let index = 0;

      // Remove socket id from user
      if (User && this.users[User.get('_id').toString()]) {
        // Get index
        index = this.users[User.get('_id').toString()].indexOf(socketid);

        // Remove user from sockets
        if (index > -1) {
          this.users[User.get('_id').toString()].splice(index, 1);
        }

        // Check if length
        if (!this.users[User.get('_id').toString()].length) delete this.users[User.get('_id').toString()];
      }

      // Remove from sessions
      if (this.sessions[session]) {
        // Get index
        index = this.sessions[session].indexOf(socketid);

        // Remove session from sessions
        if (index > -1) {
          this.sessions[session].splice(index, 1);
        }

        // Check if length
        if (!this.sessions[session].length) delete this.sessions[session];
      }

      // Delete socket
      delete this.sockets[socketid];
    });

    // Create functions for cached config
    for (let i = 0; i < sockets.length; i++) {
      // Create listener
      this._endpoint(sockets[i], socket, User);
    }

    // On call
    socket.on('eden.call', (data) => {
      // Call data
      this._call(data, socket, User);
    });
  }

  /**
   * Emit to socket funciton
   *
   * @param {Object} data
   */
  _emit (data) {
    // Check if room
    if (data.room) {
      // Emit to room
      this.io.to(data.room).emit(data.type, ...data.args);
    } else {
      // Emit to everyone
      this.io.emit(data.type, ...data.args);
    }
  }

  /**
   * Emit to user
   *
   * @param {Object} data
   */
  _user (data) {
    // Check data.to
    if (!data.to) return;

    // Loop all user socket connections
    if (this.users[data.to]) {
      for (let i = 0; i < this.users[data.to].length; i++) {
        // Set socket
        let Socket = this.sockets[this.users[data.to][i]];

        // Check if socket
        if (!Socket) continue;

        // Emit to socket
        Socket.emit(data.type, ...data.args);

        // Emit to eden
        this.eden.emit('socket.user.sent', ...data.args);
      }
    }
  }

  /**
   * Emit to user
   *
   * @param {Object} data
   */
  _session (data) {
    // Check data.to
    if (!data.session)  return;

    // Check session exists
    if (!this.sessions[data.session]) return;

    // Loop sessions
    for (let i = 0; i < this.sessions[data.session].length; i++) {
      // Set socket
      let Socket = this.sockets[this.sessions[data.session][i]];

      // Check socket exists
      if (!Socket) continue;

      // Emit to socket
      Socket.emit(data.type, ...data.args);

      // Emit to eden
      this.eden.emit('socket.session.sent', ...data.args);
    }
  }

  /**
   * Creates route listener
   *
   * @param  {Object} data
   * @param  {socket} socket
   * @param  {user}   User
   */
  async _call (data, socket, User) {
    // Reload user
    if (User) await User.refresh();

    // Loop endpoints
    let matched = calls.filter((call) => {
      // Remove call
      return data.name === call.name;
    });

    // Loop matched
    for (let i = 0; i < matched.length; i++) {
      // Get call
      let call = matched[i];

      // Check if can
      if (!await aclHelper.validate(User, call.acl)) continue;

      // Get controller
      let controller = await this.eden.controller(call.class);

      // Set opts
      let opts = {
        'args'      : data.args,
        'user'      : User,
        'call'      : data.name,
        'socket'    : socket,
        'sessionID' : socket.request.cookie[config.get('session.key') || 'eden.session.id']
      };

      // Hook opts
      await this.eden.hook('socket.call.opts', opts);

      // Run endpoint
      let response = await controller[call.fn].apply(controller, [...data.args, opts]);

      // Return response
      socket.emit(data.id, response);
    }
  }

  /**
   * Creates route listener
   *
   * @param  {Object} endpoint
   * @param  {socket} socket
   * @param  {user}   User
   */
  _endpoint (endpoint, socket, User) {
    // Create socket listener
    socket.on(endpoint.name, async (...args) => {
      // Reload user
      if (User) await User.refresh();

      // Check if can
      if (!await aclHelper.validate(User, endpoint.acl)) return;

      // Get controller
      let controller = await this.eden.controller(endpoint.class);

      // Set opts
      let opts = {
        'args'      : args,
        'user'      : User,
        'socket'    : socket,
        'sessionID' : socket.request.cookie[config.get('session.key') || 'eden.session.id']
      };

      // Hook opts
      await this.eden.hook('socket.endpoint.opts', opts);

      // Run function
      controller[endpoint.fn](...args, opts);
    });
  }

  /**
   * Publishes socket connection count
   *
   * @param {Integer} add
   *
   * @private
   */
  async _connection (add) {
    // Publish to eden
    let connections = await this.eden.get('socket.connections');

    // Add or subtract
    if (add) connections++;
    if (!add) connections--;

    // Check if < 0
    if (connections < 0) connections = 0;

    // Emit to channel
    this.eden.emit('socket.connections', connections, true);

    // Update cache
    await this.eden.set('socket.connections', connections);
  }
}

/**
 * Construct socket daemon
 *
 * @type {socket}
 */
exports = module.exports = socket;
