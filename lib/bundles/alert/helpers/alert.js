// Require local dependencies
const config = require ('config');
const socket = require ('socket');

// Require local class dependencies
const Helper = require ('helper');

// Require model classes
const Alert = model ('alert');

/**
 * Create Alert Helper class
 */
class AlertHelper extends Helper {

  /**
   * Construct Alert Helper class
   */
  constructor () {
    // Run super
    super ();

    // Bind public methods
    this.user    = this.user.bind (this);
    this.socket  = this.socket.bind (this);
    this.session = this.session.bind (this);
  }

  /**
   * Emits to user
   *
   * @param {user}   user
   * @param {String} type
   * @param {Object} opts
   * @param {*}      medium
   */
  async user (user, type, opts, medium) {
    // Create alert object
    const data = {
      'type'   : type,
      'opts'   : opts,
      'done'   : false,
      'medium' : medium || 'helper'
    };

    // Run alert compile hook
    await this.eden.hook ('alert.compile', data);

    // Create alert
    const alert = new Alert (data);

    // Set user
    alert.set ('user', user);

    // Save alert
    if (opts && opts.save) {
      // Save alert
      await alert.save ();
    } else {
      // Emit to redis
      socket.user (user, 'alert', await alert.sanitise ());
    }
  }

  /**
   * Emits to socket
   *
   * @param {socket} socket
   * @param {String} type
   * @param {Object} opts
   * @param {*}      medium
   */
  async socket (socket, type, opts, medium) {
    // Create alert object
    const data = {
      'type'   : type,
      'opts'   : opts,
      'done'   : false,
      'medium' : medium || 'helper'
    };

    // Run alert compile hook
    await this.eden.hook ('alert.compile', data);

    // Create alert
    const alert = new Alert (data);

    // Set user
    alert.set ('session', socket.request.cookie[config.get ('session.key') || 'eden.session.id']);

    // Save alert
    if (opts && opts.save) {
      // Save alert
      await alert.save ();
    } else {
      // Emit to socket
      socket.emit ('alert', data);
    }
  }

  /**
   * Emits to session
   *
   * @param {String} session
   * @param {String} type
   * @param {Object} opts
   * @param {*}      medium
   */
  async session (session, type, opts, medium) {
    // Create alert object
    const data = {
      'type'   : type,
      'opts'   : opts,
      'done'   : false,
      'medium' : medium || 'helper'
    };

    // Run alert compile hook
    await this.eden.hook ('alert.compile', data);

    // Create alert
    const alert = new Alert (data);

    // Set user
    alert.set ('session', session);

    // Save alert
    if (opts && opts.save) {
      // Save alert
      await alert.save ();
    } else {
      // Emit to session
      socket.session (session, 'alert', data);
    }
  }
}

/**
 * Export alert helper
 *
 * @type {AlertHelper}
 */
exports = module.exports = new AlertHelper ();
