// Require local dependencies
const config = require('config');
const socket = require('socket');

// Require local class dependencies
const Helper = require('helper');

// Require model classes
const Alert = model('alert');

/**
 * Create Alert Helper class
 */
class AlertHelper extends Helper {

  /**
   * Construct Alert Helper class
   */
  constructor () {
    // Run super
    super();

    // Bind private methods
    this._emitAlert = this._emitAlert.bind(this);

    // Bind public methods
    this.user    = this.user.bind(this);
    this.socket  = this.socket.bind(this);
    this.session = this.session.bind(this);
  }

  /**
   * Emits an alert
   *
   * @param {string} socketType
   * @param {*}      socketReceiver
   * @param {string} type
   * @param {string} message
   * @param {object} opts
   * @param {string} medium
   *
   * @private
   *
   * @async
   */
  async _emitAlert (socketType, socketReceiver, type, message, opts = {}, medium = 'helper') {
    // Create alert object
    const data = {
      'type'    : type,
      'opts'    : opts,
      'done'    : false,
      'medium'  : medium
    };

    // Add message to data opts
    data.opts.text = message;

    // Run alert compile hook
    await this.eden.hook('alert.compile', data);

    // Create alert
    const alert = new Alert(data);

    // Check socket type
    if (socketType === 'user') {
      // Set user
      alert.set('user', socketReceiver);
    } else if (socketType === 'socket') {
      // Set session
      alert.set('session', socketReceiver.request.cookie[config.get('session.key') || 'eden.session.id']);
    } else {
      // Set session
      alert.set('session', socketReceiver);
    }

    // Save alert
    if (opts && opts.save) {
      // Save alert
      await alert.save();
    } else if (socketType === 'socket') {
      // Emit to socket
      socketReceiver.emit('alert', data);
    } else {
      // Emit to redis
      socket[socketType](socketReceiver, 'alert', data);
    }
  }

  /**
   * Emits to user
   *
   * @param {user}   user
   * @param {string} type
   * @param {string} message
   * @param {object} opts
   * @param {string} medium
   *
   * @async
   */
  async user (user, type, message, opts = {}, medium = 'helper') {
    // Emit alert to user
    await this._emitAlert('user', user, type, message, opts, medium);
  }

  /**
   * Emits to socket
   *
   * @param {socket} socket
   * @param {string} type
   * @param {string} message
   * @param {object} opts
   * @param {string} medium
   *
   * @async
   */
  async socket (socket, type, message, opts = {}, medium = 'helper') {
    // Emit alert to socket
    await this._emitAlert('socket', socket, type, message, opts, medium);
  }

  /**
   * Emits to session
   *
   * @param {String} session
   * @param {String} type
   * @param {string} message
   * @param {object} opts
   * @param {string} medium
   *
   * @async
   */
  async session (session, type, message, opts = {}, medium = 'helper') {
    // Emit alert to session
    await this._emitAlert('session', session, type, message, opts, medium);
  }

}

/**
 * Export new Alert Helper instance
 *
 * @type {AlertHelper}
 */
exports = module.exports = new AlertHelper();
