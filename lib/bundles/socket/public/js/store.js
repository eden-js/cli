
// require dependencies
const riot = require ('riot');

/**
 * create socket store
 */
class socketStore {
  /**
   * construct socket store
   */
  constructor () {
    // set observable
    riot.observable (this);
  }
}

/**
 * export built socket store
 * 
 * @type {socketStore}
 */
module.exports = new socketStore ();
