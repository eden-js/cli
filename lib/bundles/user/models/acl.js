// require local dependencies
const model = require ('model');

/**
 * create acl model class
 */
class acl extends model {

  /**
   * construct acl model class
   */
  constructor () {
    // run super
    super (...arguments);
  }

  /**
   * sanitise acl
   *
   * @return {*}
   */
  async sanitise () {
    // check arguments
    if (arguments && arguments.length) {
      // return sanitised with arguments
      return await super.__sanitiseModel (...arguments);
    }

    // return sanitised with default
    return await super.__sanitiseModel ('name', 'value', {
      'field'          : '_id',
      'sanitisedField' : 'id',
      'default'        : false
    });
  }
}

/**
 * export acl model class
 *
 * @type {acl}
 */
exports = module.exports = acl;
