// Require local class dependencies
const Model = require ('model');

/**
 * Create Alert Model class
 */
class Alert extends Model {

  /**
   * Construct Alert Model class
   */
  constructor () {
    // Run super
    super (...arguments);

    // Bind public methods
    this.sanitise = this.sanitise.bind (this);
  }

  /**
   * Create indexes on Alert
   */
  static async initialize () {
    // Create indexes
    await this.createIndex ('done', {
      'done' : -1
    });
  }

  /**
   * Sanitise Alert
   *
   * @return {Object}
   */
  async sanitise () {
    // Check arguments
    if (arguments && arguments.length) {
      // Return sanitised with arguments
      return await super.__sanitiseModel (...arguments);
    }

    // Return sanitised with default
    return await super.__sanitiseModel ({
      'field'          : '_id',
      'sanitisedField' : 'id',
      'default'        : false
    }, {
      'field'   : 'type',
      'default' : 'info'
    }, {
      'field'   : 'opts',
      'default' : ''
    });
  }
}

/**
 * Export Alert Model class
 *
 * @type {Alert}
 */
exports = module.exports = Alert;
