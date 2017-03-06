/**
 * Created by Awesome on 2/28/2016.
 */

// require local dependencies
const model = require ('model');

/**
 * create login model
 */
class login extends model {
  /**
   * construct login model
   *
   * @param attrs
   * @param options
   */
  constructor (attrs, options) {
    // run super
    super (attrs, options);
  }
}

/**
 * export login model
 * 
 * @type {login}
 */
exports = module.exports = login;
