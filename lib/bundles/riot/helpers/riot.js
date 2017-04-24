// use strict
'use strict';

// require dependencies
const socket = require ('socket');
const helper = require ('helper');

// require models
const user = model ('user');

/**
 * build riot controller
 */
class riotHelper extends helper {
  /**
   * construct riot helper class
   */
  constructor () {
    // run super
    super ();

    // bind private methods
    this.state = this.state.bind (this);
  }

  /**
   * build state function
   *
   * @param  {User|Socket} send
   * @param  {String} url
   * @param  {Object} opts
   *
   * @private
   */
  async state (send, url, opts) {
    // send user alert
    return await socket[send instanceof user ? 'user' : 'session'] (send, 'state', {
      'url'  : url,
      'opts' : opts
    });
  }
}

/**
 * export riot controller
 *
 * @type {riotHelper}
 */
exports = module.exports = new riotHelper ();
