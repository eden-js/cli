
// require eden
const eden = require ('lib/eden');

/**
 * build base class
 */
class base {
  /**
   * construct default base
   */
  constructor () {
    // set logger
    this.eden   = eden;
    this.logger = eden.logger;
  }
}

/**
 * export base class
 *
 * @type {base}
 */
exports = module.exports = base;
