/**
 * Created by Awesome on 1/30/2016.
 */

/**
 * build controller class
 */
class controller {
  /**
   * construct standard controller
   *
   * @param  {eden} eden
   */
  constructor (eden) {
    // set eden
    this.eden   = eden;
    this.logger = this.eden.logger;
  }
}

/**
 * export controller class
 *
 * @type {controller}
 */
module.exports = controller;
