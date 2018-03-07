
// import dependencies
const model = require ('model');

/**
 * create user class
 */
class example extends model {
  /**
   * construct example model
   */
  constructor () {
    // run super
    super (...arguments);
  }
}

/**
 * export user class
 * @type {user}
 */
exports = module.exports = example;
