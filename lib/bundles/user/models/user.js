
// require dependencies
const eden   = require ('eden');
const model  = require ('model');
const config = require ('config');
const crypto = require ('crypto');
const socket = require ('socket');

/**
 * create user model
 */
class user extends model {
  /**
   * construct example model
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
    // get avatar
    let Avatar = await this.model ('avatar');
    let avatar = false;

    // check avatar
    if (Avatar) {
      avatar = await Avatar.sanitise ();
    }

    // load acl
    let Acls = await this.model ('acl') || [];
    let acls = [];

    // check acl
    for (var i = 0; i < Acls.length; i++) {
      // push to Acls
      acls.push (Acls[i].sanitise ());
    }

    // return sanitised user
    let sanitised = {
      'id'       : this.get ('_id') ? this.get ('_id').toString () : null,
      'acls'     : acls,
      'email'    : this.get ('email'),
      'avatar'   : avatar,
      'balance'  : this.get ('balance') || 0,
      'username' : this.get ('username')
    };

    // hook user login
    await eden.hook ('user.sanitise', {
      'user'      : this,
      'args'      : [...arguments],
      'sanitised' : sanitised
    });

    // return sanitised
    return sanitised;
  }
}

/**
 * export user model
 * @type {user}
 */
exports = module.exports = user;
