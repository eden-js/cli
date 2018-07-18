// Require dependencies
const dotProp = require('dot-prop-immutable');

// Require local dependencies
const store = require('default/public/js/store');

/**
 * Build acl class
 */
class acl {

  /**
   * Construct acl class
   */
  constructor () {
    // Bind methods
    this.list     = this.list.bind(this);
    this.validate = this.validate.bind(this);
  }

  /**
   * Validates acl
   *
   * @param {Array} tests
   * @param {Array} list
   *
   * @returns {Boolean}
   */
  validate (tests, list) {
    // Get list
    let obj  = {};
    let user = store.user || store.get('user');

    // Set list
    list = list || this.list();

    // Check is array
    if (Array.isArray(list)) {
      // Set list
      for (let item of list) {
        // Set value
        obj = dotProp.set(obj, item, true);
      }
    }

    // Set array if not
    if (!Array.isArray(tests)) tests = [tests];

    // Find failed test
    return !(tests.filter((test) => {
      // Check if true/false
      if (test.toString() === 'true' && (!user || !user.id)) return true;
      if (test.toString() === 'false' && (user && user.id)) return true;

      // Check list
      if (list === true) return false;

      // Loop props
      return !dotProp.get(obj, test) && !dotProp.get(obj, test.split('.').slice(0, -1).join('.') + '.*');
    })).length;
  }

  /**
   * Gets acl list from user
   *
   * @returns {Array}
   */
  list () {
    // Set user
    let user = store.user || store.get('user');

    // Return array if no user
    if (!user || !user.id) return [];

    // Get groups
    let acls = [];
    let Acls = user.acls || [];

    // Loop Acls
    for (let a = 0; a < Acls.length; a++) {
      // Check acl index
      if (Acls[a].value === true) return true;

      // Loop values
      for (let b = 0; b < Acls[a].value.length; b++) {
        // Check if already in Array
        if (!acls.includes(Acls[a].value)) {
          // Push into acls
          acls.push(Acls[a].value[b]);
        }
      }
    }

    // Return acls
    return acls;
  }
}

/**
 * Export acl class
 *
 * @type {acl}
 */
exports = module.exports = new acl();
