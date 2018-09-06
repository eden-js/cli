
// Require polyfill
require('@babel/polyfill');

// Create built
let built = null;

// Require riot
const events = require('events');

// Require dependencies
const acl    = require('user/public/js/acl');
const store  = require('default/public/js/store');
const socket = require('socket/public/js/bootstrap');

/**
 * Build alert class
 */
class user extends events {

  /**
   * Construct edenAlert class
   */
  constructor () {
    // Run super
    super(...arguments);

    // Set fields
    this.fields = [];

    // Set private fields
    this._user = null;

    // Set acl
    this.acl = acl;

    // Bind methods
    this.get     = this.get.bind(this);
    this.set     = this.set.bind(this);
    this.build   = this.build.bind(this);
    this.exists  = this.exists.bind(this);
    this.refresh = this.refresh.bind(this);

    // Bind private methods
    this._event = this._event.bind(this);

    // Build user
    this.building = this.build();
  }

  /**
   * Sets key value
   *
   * @param {String} key
   *
   * @returns {*}
   */
  get (key) {
    // Check key
    if (!key) return this._user;

    // Set key/value
    return this._user[key];
  }

  /**
   * Sets key value
   *
   * @param {String} key
   * @param {*}      value
   */
  set (key, value) {
    // Check values
    if (['acl'].includes(key)) return;

    // Set key/value
    this[key]       = value;
    this._user[key] = value;

    // Check in fields
    if (!this.fields.includes(key)) this.fields.push(key);

    // Trigger key
    this.emit(key, value);
  }

  /**
   * Builds user
   */
  build () {
    // Set values
    let User = store.get('user');

    // Set user
    this._user = User;

    // Check user
    for (let key in User) {
      // Set value
      this[key] = User[key];

      // Check in fields
      if (!this.fields.includes(key)) this.fields.push(key);
    }

    // Pre user
    store.pre('set', (data) => {
      // Check key
      if (data.key !== 'user') return;

      // Set value
      this._event(data.val);

      // Set val
      data.val = this;
    });

    // On user socket
    socket.on('user', this._event);
  }

  /**
   * Refresh user
   */
  async refresh () {
    // Refresh
    this._event(await socket.call('user.refresh'));
  }

  /**
   * Clears user
   */
  clear () {
    // Loop fields
    this.fields.forEach((field) => {
      // Delete key
      delete this[field];
    });

    // Reset fields
    this.fields = [];
  }

  /**
   * Return exists
   *
   * @return {Boolean}
   */
  exists () {
    // Return this.id
    return !!this.id;
  }

  /**
   * Sets user
   *
   * @param  {Object} User
   *
   * @returns {*}
   */
  _event (User) {
    // Set built
    store.user = built;

    // Set user
    this._user = User;

    // Check no user
    if (!User) return this.clear();

    // Emit stuff
    for (let key in User) {
      // Set value
      if (this[key] !== User[key]) {
        // Set value
        this.set(key, User[key]);
      }

      // Check in fields
      if (!this.fields.includes(key)) this.fields.push(key);
    }

    // Update user
    this.emit('update');
  }
}

/**
 * Build alert class
 *
 * @type {edenAlert}
 */
built = new user();

/**
 * Export alert class
 *
 * @type {user}
 */
exports = module.exports = built;

/**
 * Add user to window.eden
 */
window.eden.user = built;
