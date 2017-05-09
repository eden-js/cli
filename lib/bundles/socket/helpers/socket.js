
// require dependencies
const helper = require ('helper');

// require local dependencies
const config = require ('config');

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
    let conn = config.get ('redis');

    // add key
    conn.key = config.get ('domain') + '.socket';
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
    this.eden.emit ('socket.room', {
      'room' : name,
      'type' : type,
      'data' : data
    }, true);
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
    this.eden.emit ('socket.all', {
      'type' : type,
      'data' : data
    }, true);
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
