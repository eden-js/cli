/**
 * Created by Awesome on 2/23/2016.
 */

// require dependencies
const eden   = require ('eden');
const model  = require ('model');
const crypto = require ('crypto');
const socket = require ('socket');

// require local dependencies
const config   = require ('app/config');
const aclModel = require ('user/models/acl');

/**
 * create user model
 */
class user extends model {
  /**
   * construct example model
   *
   * @param attrs
   * @param options
   */
  constructor (attrs, options) {
    // run super
    super (attrs, options);

    // bind auth methods
    this.authenticate = this.authenticate.bind (this);

    // bind socket methods
    this.emit     = this.emit.bind (this);
    this.alert    = this.alert.bind (this);
    this.sanitise = this.sanitise.bind (this);
  }

  /**
   * check ACL before save
   */
  configure () {
    // before creation, check acl
    this.before ('create', '_acl');
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
      .createHmac ('sha256', config.secret)
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
   * check ACL
   *
   * @return {Promise}
   */
  async _acl () {
    // set array
    let arr  = [];

    // check default acl
    let def = await aclModel.where ({
      'name' : config.acl.default.name
    }).findOne ();

    // check default acl exists
    if (!def) {
      // add new acl
      def = new aclModel (config.acl.default);

      // save defailt
      await def.save ();
    }

    // set user acl
    arr.push (def);

    // check first
    let count = await user.count ();

    // check count
    if (!count) {
      // check first acl
      var adm = await aclModel.where ({
        'name' : config.acl.first.name
      }).findOne ();

      // check first acl exists
      if (!adm) {
        // add new acl
        adm = new aclModel (config.acl.first);

        // save admin acl
        await adm.save ();
      }

      // set user acl
      arr.push (adm);
    }

    // set acl
    this.set ('acl', arr);

    // run next
    return true;
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

    // return sanitised user
    let sanitised = {
      'id'       : this.get ('_id').toString (),
      'avatar'   : avatar,
      'balance'  : this.get ('balance') || 0,
      'username' : this.get ('username')
    };

    // hook user login
    await eden.hook ('user:sanitise', {
      'user'      : this,
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
