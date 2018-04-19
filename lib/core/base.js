
// require eden
const eden   = require ('lib/eden');
const events = require ('events');

/**
 * build base class
 */
class base extends events {
  
  /**
   * construct default base
   */
  constructor () {
    // run super
    super ();

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
