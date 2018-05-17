// Require local dependencies
const eden   = require('eden');
const model  = require('model');
const config = require('config');
const crypto = require('crypto');
const socket = require('socket');

/**
 * Create user model class
 */
class user extends model {

  /**
   * Construct user model class
   */
  constructor () {
    // Run super
    super(...arguments);

    // Bind auth methods
    this.authenticate = this.authenticate.bind(this);

    // Bind socket methods
    this.emit     = this.emit.bind(this);
    this.name     = this.name.bind(this);
    this.alert    = this.alert.bind(this);
    this.sanitise = this.sanitise.bind(this);
  }

  /**
   * Authenticates user
   *
   * @param {String} password
   *
   * @returns {Promise}
   */
  async authenticate (password) {
    // Compare hash with password
    let hash  = this.get('hash');
    let check = crypto
      .createHmac('sha256', config.get('secret'))
      .update(password)
      .digest('hex');

    // Check if password correct
    if (check !== hash) {
      return {
        'info'  : 'Incorrect password',
        'error' : true
      };
    }

    // Password accepted
    return true;
  }

  /**
   * Returns users name
   *
   * @return {String} name
   */
  name () {
    // Check name
    let name = (this.get('first') || '') + ' ' + (this.get('last') || '');

    // Return name
    return (name === ' ' ? (this.get('email') || this.get('username')) : name).trim();
  }

  /**
   * Emits to socketio
   *
   * @param  {String} type
   * @param  {Object} data
   *
   * @return {*}
   */
  emit (type, data) {
    // Return socket emission
    return socket.user(this, type, data);
  }

  /**
   * Alerts user
   *
   * @param  {String} message
   * @param  {String} type
   * @param  {Object} options
   *
   * @return {*}
   */
  alert (message, type, options) {
    // Return socket emission
    return socket.alert(this, message, type, options);
  }

  /**
   * Sanitises user
   *
   * @return {*}
   */
  async sanitise () {
    // Check arguments
    if (arguments && arguments.length) {
      // Return sanitised with arguments
      return await super.__sanitiseModel(...arguments);
    }

    // Return sanitised with default
    return await super.__sanitiseModel('email', 'username', {
      'field'          : '_id',
      'sanitisedField' : 'id',
      'default'        : false
    }, {
      'field'          : 'acl',
      'sanitisedField' : 'acls',
      'default'        : []
    }, {
      'field'   : 'avatar',
      'default' : false
    }, {
      'field'   : 'balance',
      'default' : 0
    });
  }
}

/**
 * Export user model
 * @type {user}
 */
exports = module.exports = user;
