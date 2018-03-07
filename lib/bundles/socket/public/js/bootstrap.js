
// require dependencies
const io   = require ('socket.io-client');
const uuid = require ('uuid');

// require local dependencies
const store = require ('default/public/js/store');

/**
 * build socket class
 */
class socket {
  /**
   * construct socket class
   */
  constructor () {
    // set variables
    this.user = window.eden.user ? window.eden.user.id : false;

    // bind private methods
    this._user = this._user.bind (this);

    // run socket
    this.socket = io.connect (store.get ('config').socket.url, store.get ('config').socket.params);

    // bind methods
    this.on   = this.socket.on.bind (this.socket);
    this.off  = this.socket.off.bind (this.socket);
    this.emit = this.socket.emit.bind (this.socket);
    this.once = this.socket.once.bind (this.socket);

    // listen to route
    this.on ('user', this._user);

    // store on user
    store.on ('user', this._user);
  }

  /**
   * calls name and data
   *
   * @param  {String} name
   * @params {*} args
   *
   * @return {Promise}
   */
  async call (name, ...args) {
    // let id
    let id = uuid ();

    // create emission
    let emission = {
      'id'   : id,
      'args' : args,
      'name' : name
    };

    // emit to socket
    this.emit ('eden.call', emission);

    // await one response
    let result = await new Promise ((resolve) => {
      // on message
      this.once (id, resolve);
    });

    // return result
    return result;
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

/**
 * export built socket class
 *
 * @type {socket}
 */
exports = module.exports = window.eden.socket = new socket ();
