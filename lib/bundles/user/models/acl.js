
// require dependencies
const model = require ('model');

/**
 * create acl model
 */
class acl extends model {
  /**
   * construct acl model
   */
  constructor () {
    // run super
    super (...arguments);
  }

  /**
   * sanitises acl class
   *
   * @return {*}
   */
  sanitise () {
    return {
      'id'    : this.get ('_id') ? this.get ('_id').toString () : false,
      'name'  : this.get ('name'),
      'value' : this.get ('value')
    };
  }
}

/**
 * export acl model
 * @type {acl}
 */
exports = module.exports = acl;
