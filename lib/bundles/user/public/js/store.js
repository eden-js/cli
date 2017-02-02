
// require dependencies
const riot        = require ('riot');
const riotcontrol = require ('riotcontrol');

// require local dependencies
const socket = require ('socket/public/js/bootstrap');

/**
 * create user store
 */
class userStore {
  /**
   * construct user store
   */
  constructor () {
    // set observable
    riot.observable (this);

    // set variables
    this.user = (typeof window !== 'undefined') ? window.eden.state.user : false;

    // bind methods
    this.state = this.state.bind (this);

    // bind private methods
    this._emit = this._emit.bind (this);
    this._user = this._user.bind (this);

    // on user
    this.on ('user:init', this._emit);

    // on socket user
    socket.on ('user', this._user);

    // on change page
    riotcontrol.on ('route', this.state);
  }

  /**
   * on state
   *
   * @param {Object} opts
   */
  state (opts) {
    // check user defined
    if (typeof opts.user !== 'undefined') this._user (opts.user);
  }

  /**
   * on user
   *
   * @param {Object} user
   */
  _user (user) {
    // set user
    this.user = user;

    // emit user
    this._emit ();
  }

  /**
   * emits user
   *
   * @private
   */
  _emit () {
    // emit user
    this.trigger ('user', this.user);
  }
}

/**
 * export built user store
 *
 * @type {userStore}
 */
module.exports = new userStore ();
