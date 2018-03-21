
// require dependencies
const config = require ('config');
const helper = require ('helper');
const socket = require ('socket');

// require models
const alert = model ('alert');

/**
 * build socket helper class
 */
class alertHelper extends helper {

  /**
   * construct socket helper class
   */
  constructor () {
    // run super
    super ();

    // bind methods
    this.user    = this.user.bind (this);
    this.socket  = this.socket.bind (this);
    this.session = this.session.bind (this);
  }

  /**
   * emits to user
   *
   * @param  {user}   User
   * @param  {String} type
   * @param  {Object} opts
   * @param  {*}      medium
   */
  async user (User, type, opts, medium) {
    // create alert object
    let data = {
      'type'   : type,
      'opts'   : opts,
      'done'   : false,
      'medium' : medium || 'helper'
    };

    // await
    await this.eden.hook ('alert.compile', data);

    // create alert
    var Alert = new alert (data);

    // set user
    Alert.set ('user', User);

    // save alert
    if (opts && opts.save) {
      // save alert
      await Alert.save ();
    } else {
      // emit to redis
      socket.user (User, 'alert', await Alert.sanitise ());
    }
  }

  /**
   * emits to socket
   *
   * @param  {socket} Socket
   * @param  {String} type
   * @param  {Object} opts
   * @param  {*}      medium
   */
  async socket (Socket, type, opts, medium) {
    // create alert object
    let data = {
      'type'   : type,
      'opts'   : opts,
      'done'   : false,
      'medium' : medium || 'helper'
    };

    // await
    await this.eden.hook ('alert.compile', data);

    // create alert
    var Alert = new alert (data);

    // set user
    Alert.set ('session', Socket.request.cookie[config.get ('session.key') || 'eden.session.id']);

    // save alert
    if (opts && opts.save) {
      // save alert
      await Alert.save ();
    } else {
      // emit to socket
      Socket.emit ('alert', data);
    }
  }

  /**
   * emits to socket
   *
   * @param  {String} session
   * @param  {String} type
   * @param  {Object} opts
   * @param  {*}      medium
   */
  async session (session, type, opts, medium) {
    // create alert object
    let data = {
      'type'   : type,
      'opts'   : opts,
      'done'   : false,
      'medium' : medium || 'helper'
    };

    // await
    await this.eden.hook ('alert.compile', data);

    // create alert
    var Alert = new alert (data);

    // set user
    Alert.set ('session', session);

    // save alert
    if (opts && opts.save) {
      // save alert
      await Alert.save ();
    } else {
      // emit to socket
      socket.session (session, 'alert', data);
    }
  }
}

/**
 * export alert helper
 *
 * @type {alertHelper}
 */
exports = module.exports = new alertHelper ();
