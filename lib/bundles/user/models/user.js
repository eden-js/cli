// require local dependencies
const eden   = require ('eden');
const model  = require ('model');
const config = require ('config');
const crypto = require ('crypto');
const socket = require ('socket');

/**
 * create user model class
 */
class user extends model {

  /**
   * construct user model class
   */
  constructor () {
    // run super
    super (...arguments);

    // bind auth methods
    this.authenticate = this.authenticate.bind (this);

    // bind socket methods
    this.emit     = this.emit.bind (this);
    this.name     = this.name.bind (this);
    this.alert    = this.alert.bind (this);
    this.sanitise = this.sanitise.bind (this);
  }

  /**
   * authenticates user
   *
   * @param {String} password
   *
   * @returns {Promise}
   */
  async authenticate (password) {
    // compare hash with password
    let hash  = this.get ('hash');
    let check = crypto
      .createHmac ('sha256', config.get ('secret'))
      .update (password)
      .digest ('hex');

    // check if password correct
    if (check !== hash) {
      return {
        'info'  : 'Incorrect password',
        'error' : true
      };
    }

    // password accepted
    return true;
  }

  /**
   * returns users name
   *
   * @return {String} name
   */
  name () {
    // check name
    let name = (this.get ('first') || '') + ' ' + (this.get ('last') || '');

    // return name
    return (name === ' ' ? (this.get ('email') || this.get ('username')) : name).trim ();
  }

  /**
   * emits to socketio
   *
   * @param  {String} type
   * @param  {Object} data
   *
   * @return {*}
   */
  emit (type, data) {
    // return socket emission
    return socket.user (this, type, data);
  }

  /**
   * alerts user
   *
   * @param  {String} message
   * @param  {String} type
   * @param  {Object} options
   *
   * @return {*}
   */
  alert (message, type, options) {
    // return socket emission
    return socket.alert (this, message, type, options);
  }

  /**
   * sanitises user
   *
   * @return {*}
   */
  async sanitise () {
    // check arguments
    if (arguments && arguments.length) {
      // return sanitised with arguments
      return await super.__sanitiseModel (...arguments);
    }

    // return sanitised with default
    return await super.__sanitiseModel ('email', 'username', {
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
 * export user model
 * @type {user}
 */
exports = module.exports = user;
