// Require local class dependencies
const Model = require('model');

/**
 * Create Example Model class
 */
class Example extends Model {

  /**
   * Construct Example Model class
   */
  constructor () {
    // Run super
    super(...arguments);
  }

}

/**
 * Export Example Model class
 *
 * @type {Example}
 */
exports = module.exports = Example;
