
// import dependencies
const Helper = require('helper');

/**
 * extend $${model.toLowerCase()} helper
 *
 * @extends {helper}
 */
class $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()}Helper extends Helper {
  /**
   * construct notification helper
   */
  constructor() {
    // run super
    super();
  }
}

/**
 * export built $${model.toLowerCase()} helper
 *
 * @type {$${model.toLowerCase()}Helper}
 */
module.exports = new $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()}Helper();
