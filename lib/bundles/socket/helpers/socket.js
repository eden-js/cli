/**
 * Created by Awesome on 3/13/2016.
 */

// use strict
'use strict';

// require dependencies
const io     = require ('socket.io-emitter');
const helper = require ('helper');

// require local dependencies
const config = require ('app/config');

/**
 * build socket helper class
 */
class socket extends helper {
  /**
   * construct socket helper class
   */
  constructor () {
    // run super
    super ();

    // bind methods
    this.room    = this.room.bind (this);
    this.user    = this.user.bind (this);
    this.emit    = this.emit.bind (this);
    this.session = this.session.bind (this);

    // setup redis conn
    let conn = JSON.parse (JSON.stringify (config.redis || {}));

    // add key
    conn.key = config.domain + '.socket';

    // bind redis
    this._io = io (conn);
  }

  /**
   * emits to room
   *
   * @param  {String}  name
   * @param  {String}  type
   * @param  {*}       data
   */
  room (name, type, data) {
    // emit to socket
    this._io.to (name).emit (type, data);
  }

  /**
   * emits to user
   *
   * @param  {user}    User
   * @param  {String}  type
   * @param  {*}       data
   */
  user (User, type, data) {
    // emit to socket
    this.eden.emit ('socket.user', {
      'to'   : (User ? User.get ('_id').toString () : true),
      'type' : type,
      'data' : data
    }, true);
  }

  /**
   * emit information
   *
   * @param  {String}  type
   * @param  {*}       data
   * @param  {user}    User
   */
  emit (type, data) {
    // emit to socket
    this._io.emit (type, data);
  }

  /**
   * emit by session id
   *
   * @param {String} session
   * @param {String} type
   * @param {Object} data
   */
  session (session, type, data) {
    // emit to socket
    this.eden.emit ('socket.session', {
      'data'    : data,
      'type'    : type,
      'session' : session
    }, true);
  }
}

/**
 * export socket helper
 *
 * @type {socket}
 */
exports = module.exports = new socket ();
