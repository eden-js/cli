
// require dependencies
const dotProp = require ('dot-prop');

// require local dependencies
const store = require ('default/public/js/store');

/**
 * build acl class
 */
class acl {

  /**
   * construct acl class
   */
  constructor () {
    // bind methods
    this.list     = this.list.bind (this);
    this.validate = this.validate.bind (this);
  }

  /**
   * validates acl
   *
   * @param {Array} tests
   * @param {Array} list
   *
   * @returns {Boolean}
   */
  validate (tests, list) {
    // get list
    let obj  = {};
    let user = store.user || store.get ('user');

    // set list
    list = list || this.list ();

    // check is array
    if (Array.isArray (list)) {
      // set list
      for (let item of list) {
        // set value
        dotProp.set (obj, item, true);
      }
    }

    // set array if not
    if (!Array.isArray (tests)) tests = [tests];

    // find failed test
    return !(tests.filter ((test) => {
      // check if true/false
      if (test.toString () === 'true' && (!user || !user.id)) return true;
      if (test.toString () === 'false' && (user && user.id)) return true;

      // check list
      if (list === true) return false;

      // loop props
      return !dotProp.get (obj, test) && !dotProp.get (obj, test.split ('.').slice (0, -1).join ('.') + '.*');
    })).length;
  }

  /**
   * gets acl list from user
   *
   * @returns {Array}
   */
  list () {
    // set user
    let user = store.user || store.get ('user');

    // return array if no user
    if (!user || !user.id) return [];

    // get groups
    let acls = [];
    let Acls = user.acls || [];

    // loop Acls
    for (var a = 0; a < Acls.length; a++) {
      // check acl index
      if (Acls[a].value === true) return true;

      // loop values
      for (var b = 0; b < Acls[a].value.length; b++) {
        // check if already in Array
        if (acls.indexOf (Acls[a].value) === -1) {
          // push into acls
          acls.push (Acls[a].value[b]);
        }
      }
    }

    // return acls
    return acls;
  }
}

/**
 * export acl class
 *
 * @type {acl}
 */
exports = module.exports = new acl ();
