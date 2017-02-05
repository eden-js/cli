/**
 * Created by Awesome on 3/13/2016.
 */

// use strict
'use strict';

// require dependencies
const io          = require ('socket.io-client');
const riotcontrol = require ('riotcontrol');

// require local dependencies
const store = require ('./store');

/**
 * build socket class
 */
class socket {
  /**
   * construct socket class
   */
  constructor () {
    // set private variables
    this._store = store;

    // add store
    riotcontrol.addStore (this._store);

    // set variables
    this.user = window.eden.user ? window.eden.user.id : false;

    // bind methods
    this.on    = this.on.bind (this);
    this.off   = this.off.bind (this);
    this._user = this._user.bind (this);

    // run socket
    this.socket = io.connect (window.eden.config.socket.url, window.eden.config.socket.params);

    // listen to riotcontrol route
    riotcontrol.on ('user', this._user);
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
  _user (user) {
    // check if logging out
    if (user === false && this.user) {
      // logout
      this.user = false;

      // reconnect
      return this.socket.disconnect () && this.socket.connect ();
    }

    // check if logging out
    if (user && (!this.user || this.user !== user.id)) {
      // logout
      this.user = user.id;

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
