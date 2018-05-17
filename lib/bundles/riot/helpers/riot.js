// Use strict


// Require dependencies
const socket = require('socket');
const helper = require('helper');

// Require models
const user = model('user');

/**
 * Build riot controller
 */
class riotHelper extends helper {

  /**
   * Construct riot helper class
   */
  constructor () {
    // Run super
    super();

    // Bind private methods
    this.state = this.state.bind(this);
  }

  /**
   * Build state function
   *
   * @param  {User|Socket} send
   * @param  {String} url
   * @param  {Object} opts
   *
   * @private
   */
  async state (send, url, opts) {
    // Send user alert
    return await socket[send instanceof user ? 'user' : 'session'](send, 'state', {
      'url'  : url,
      'opts' : opts
    });
  }
}

/**
 * Export riot controller
 *
 * @type {riotHelper}
 */
exports = module.exports = new riotHelper();
