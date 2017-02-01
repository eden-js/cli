/**
 * Created by Awesome on 3/13/2016.
 */

// use strict
'use strict';

// require dependencies
const io = require ('socket.io-client');

/**
 * build socket class
 */
class socket {
  /**
   * construct socket class
   */
  constructor () {
    // set variables
    this.user = window.eden.state.user ? window.eden.state.user.id : false;

    // bind methods
    this.on    = this.on.bind (this);
    this.off   = this.off.bind (this);
    this.state = this.state.bind (this);

    // run socket
    this.socket = io.connect (window.eden.config.socket.url, window.eden.config.socket.params);

    // listen to router
    jQuery (document).ready (() => {
      // listen to router state change
      window.eden.router.history.listen (this.state);
    });
  }

  /**
   * run this on
   *
   * @param type
   * @param fn
   */
  on (type, fn) {
    this.socket.on (type, fn);
  }

  /**
   * off function
   *
   * @param type
   * @param fn
   */
  off (type, fn) {
    this.socket.off (type, fn);
  }

  /**
   * emits to socket
   *
   * @param  {String} type
   * @param  {*}      data
   */
  emit (type, data) {
    this.socket.emit (type, data);
  }

  /**
   * listen to state change
   *
   * @param {Object} location
   * @param {String} action
   */
  state (location, action) {
    // check state is returned
    if (!location.state || !Object.keys (location.state).length) {
      // return
      return;
    }

    // check if logging out
    if (!location.state.user && this.user) {
      // logout
      this.user = false;

      // reconnect
      return this.socket.disconnect () && this.socket.connect ();
    }

    // check if logging out
    if (location.state.user && (!this.user || this.user !== location.state.user.id)) {
      // logout
      this.user = location.state.user.id;

      // reconnect
      return this.socket.disconnect () && this.socket.connect ();
    }
  }
}

// build socket class
window.eden.socket = new socket ();

/**
 * export socket class
 *
 * @type {socket}
 */
module.exports = window.eden.socket;
