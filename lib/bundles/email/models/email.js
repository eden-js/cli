// Require local class dependencies
const Model = require('model');

/**
 * Create Email Model class
 */
class Email extends Model {

  /**
   * Construct Email Model class
   */
  constructor () {
    // Run super
    super(...arguments);
  }

}

/**
 * Export Email Model class
 *
 * @type {Email}
 */
exports = module.exports = Email;
