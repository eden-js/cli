/**
 * Created by Awesome on 3/13/2016.
 */

// use strict
'use strict';

// require dependencies
var helper = require ('helper');
var socket = require ('socket');

// require local dependencies
var alert  = require ('alert/models/alert');
var config = require ('app/config');

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
   * @param  {String} message
   * @param  {Object} opts
   */
  async user (User, type, message, opts) {
    // create alert object
    var create = {
      'type'    : type,
      'message' : message
    };

    // set variables
    if (opts) create.options = opts;

    // create alert
    var Alert = new alert (create);

    // set user
    Alert.set ('user', User);

    // save alert
    if (!opts.preventSave) await Alert.save ();

    // emit to redis
    socket.user (User, 'alert', await Alert.sanitise ());
  }

  /**
   * emits to socket
   *
   * @param  {socket} Socket
   * @param  {String} type
   * @param  {String} message
   * @param  {Object} opts
   */
  socket (Socket, type, message, opts) {
    // create alert object
    var create = {
      'type'    : type,
      'message' : message
    };

    // set variables
    if (opts) create.options = opts;

    // emit to socket
    Socket.emit ('alert', create);
  }
}

/**
 * export alert helper
 *
 * @type {alertHelper}
 */
module.exports = new alertHelper ();
