
// require dependencies
const model = require ('model');

/**
 * create email model
 */
class email extends model {
  /**
   * construct email model
   *
   * @param a
   * @param b
   */
  constructor (a, b) {
    // run super
    super (a, b);
  }
}

/**
 * export email model
 *
 * @type {email}
 */
exports = module.exports = email;
