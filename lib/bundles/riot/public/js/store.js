
// require dependencies
const riot = require ('riot');

/**
 * create riot store
 */
class riotStore {
  /**
   * construct riot store
   */
  constructor () {
    // set observable
    riot.observable (this);
  }
}

/**
 * export built riot store
 * 
 * @type {riotStore}
 */
module.exports = new riotStore ();
