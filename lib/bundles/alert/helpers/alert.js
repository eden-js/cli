/**
 * Created by Awesome on 3/13/2016.
 */

// use strict
'use strict';

// require dependencies
const helper = require ('helper');
const socket = require ('socket');

// require models
const alert = model ('alert');

/**
 * build socket helper class
 */
class alertHelper extends helper {
  /**
   * construct socket helper class
   */
  constructor () {
    // run super
    super ();

    // bind methods
    this.user   = this.user.bind (this);
    this.socket = this.socket.bind (this);
  }

  /**
   * emits to user
   *
   * @param  {user}   User
   * @param  {String} type
   * @param  {Object} opts
   */
  async user (User, type, opts) {
    // create alert object
    var create = {
      'type' : type,
      'opts' : opts
    };

    // create alert
    var Alert = new alert (create);

    // set user
    Alert.set ('user', User);

    // save alert
    if (opts && opts.save) await Alert.save ();

    // emit to redis
    socket.user (User, 'alert', await Alert.sanitise ());
  }

  /**
   * emits to socket
   *
   * @param  {socket} Socket
   * @param  {String} type
   * @param  {Object} opts
   */
  socket (Socket, type, opts) {
    // create alert object
    var create = {
      'type' : type,
      'opts' : opts
    };

    // emit to socket
    Socket.emit ('alert', create);
  }
}

/**
 * export alert helper
 *
 * @type {alertHelper}
 */
exports = module.exports = new alertHelper ();
