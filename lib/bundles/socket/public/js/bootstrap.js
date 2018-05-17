
// Require dependencies
const io   = require('socket.io-client');
const uuid = require('uuid');

// Require local dependencies
const store = require('default/public/js/store');

/**
 * Build socket class
 */
class socket {

  /**
   * Construct socket class
   */
  constructor () {
    // Set variables
    this.user = window.eden.user ? window.eden.user.id : false;

    // Bind private methods
    this._user = this._user.bind(this);

    // Run socket
    this.socket = io.connect(store.get('config').socket.url, store.get('config').socket.params);

    // Bind methods
    this.on   = this.socket.on.bind(this.socket);
    this.off  = this.socket.off.bind(this.socket);
    this.emit = this.socket.emit.bind(this.socket);
    this.once = this.socket.once.bind(this.socket);

    // Listen to route
    this.on('user', this._user);

    // Store on user
    store.on('user', this._user);
  }

  /**
   * Calls name and data
   *
   * @param  {String} name
   * @params {*} args
   *
   * @return {Promise}
   */
  async call (name, ...args) {
    // Let id
    let id = uuid();

    // Create emission
    let emission = {
      'id'   : id,
      'args' : args,
      'name' : name
    };

    // Emit to socket
    this.emit('eden.call', emission);

    // Await one response
    let result = await new Promise((resolve) => {
      // On message
      this.once(id, resolve);
    });

    // Return result
    return result;
  }

  /**
   * Listen to state change
   *
   * @param {Object} user
   *
   * @return {*}
   */
  _user (user) {
    // Check if logging out
    if (user === false && this.user) {
      // Logout
      this.user = false;

      // Reconnect
      return this.socket.disconnect() && this.socket.connect();
    }

    // Check if logging out
    if (user && (!this.user || this.user !== user.id)) {
      // Logout
      this.user = user.id;

      // Reconnect
      return this.socket.disconnect() && this.socket.connect();
    }
  }
}

/**
 * Export built socket class
 *
 * @type {socket}
 */
exports = module.exports = window.eden.socket = new socket();
