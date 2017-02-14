/**
 * Created by Awesome on 1/30/2016.
 */

/**
 * build helper class
 */
class helper {
  /**
   * construct default helper
   */
  constructor () {
    // set logger
    this.eden   = global.eden;
    this.logger = this.eden.logger;
  }
}

/**
 * export helper class
 *
 * @type {helper}
 */
module.exports = helper;
