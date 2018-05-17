
// Require dependencies
const model = require('model');

/**
 * Create acl model
 */
class acl extends model {

  /**
   * Construct acl model
   */
  constructor () {
    // Run super
    super(...arguments);
  }

  /**
   * Sanitises acl class
   *
   * @return {*}
   */
  sanitise () {
    // Return id/name/value
    return {
      'id'    : this.get('_id') ? this.get('_id').toString() : false,
      'name'  : this.get('name'),
      'value' : this.get('value')
    };
  }
}

/**
 * Export acl model
 * @type {acl}
 */
exports = module.exports = acl;
