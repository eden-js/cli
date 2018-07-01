// Require dependencies
const dotProp = require('dot-prop-immutable');

/**
 * Build acl class
 */
class aclHelper {

  /**
   * Construct acl class
   */
  constructor () {
    // Bind methods
    this.list       = this.list.bind(this);
    this.validate   = this.validate.bind(this);
    this.middleware = this.middleware.bind(this);
  }

  /**
   * Validates acl list against user
   *
   * this method will return false if the user does not have access to a certain
   * acl list, to check an acl against a user simply:
   *   await aclHelper.validate (User, ['user.view', 'user.create'])
   *    OR
   *   await aclHelper.validate (User, 'user.view')
   *
   * @param {user}    User
   * @param {*|Array} tests
   *
   * @return {Promise}
   */
  async validate (User, tests) {
    // Get list
    let obj  = {};
    let list = await this.list(User);

    // Check is array
    if (Array.isArray(list)) {
      // Set list
      for (let item of list) {
        // Set value
        dotProp.set(obj, item, true);
      }
    }

    // Set array if not
    if (!Array.isArray(tests)) tests = [tests];

    // Find failed test
    return !(tests.filter((test) => {
      // Check if true/false
      if (test.toString() === 'true' && !User) return true;
      if (test.toString() === 'false' && User) return true;

      // Check list
      if (list === true) return false;

      // Loop props
      return !dotProp.get(obj, test) && !dotProp.get(obj, test.split('.').slice(0, -1).join('.') + '.*');
    })).length;
  }

  /**
   * Lists and flattens acl applied to a user
   *
   * this method will return an array of group acls associated with a particular
   * user, to use this method simply:
   *    await aclHelper.list (User)
   *
   * if this method returns `true` this means the user is a super administrator
   *
   * @param {user} User
   *
   * @return {Array|Boolean}
   * @private
   */
  async list (User) {
    // Return array if no user
    if (!User) return [];

    // Get groups
    let acls = [];
    let Acls = await User.get('acl') || [];

    // Loop Acls
    for (let a = 0; a < Acls.length; a++) {
      // Check if get
      if (!Acls[a] || !Acls[a].get) {
        continue;
      }

      // Check acl index
      if (Acls[a].get('value') === true) return true;

      // Loop values
      for (let b = 0; b < Acls[a].get('value').length; b++) {
        // Check if already in Array
        if (!acls.includes(Acls[a].get('value')[b])) {
          // Push into acls
          acls.push(Acls[a].get('value')[b]);
        }
      }
    }

    // Return acls
    return acls;
  }

  /**
   * Expressjs middleware for checking route acl against the current user
   *
   * if this fails, either the user will be redirected to the resulting
   * directive labeled by @fail, or will be sent to the next route using:
   *    @fail /route/to/redirect/to
   *      OR
   *    @fail next
   *
   * @param {request}  req
   * @param {response} res
   * @param {callback} next
   *
   * @return {Integer}
   */
  async middleware (req, res) {
    // Check route has acl
    if (!res.locals.route || !res.locals.route.acl || !res.locals.route.acl.length) return true;

    // Check acl
    let check = await this.validate(req.user, res.locals.route.acl);

    // Check if true
    if (!check) {
      // Check if redirect
      if (res.locals.route.fail) {
        // Check if next
        if (res.locals.route.fail === 'next') {
          // Return false
          return 0;
        }

        // Redirect to fail auth redirect
        res.redirect(res.locals.route.fail);

        // Return false
        return 2;
      }

      // Redirect home
      res.redirect('/');

      // Return false
      return 2;
    }

    // Do next
    return 1;
  }
}

/**
 * Export aclHelper class
 *
 * @type {aclHelper}
 */
exports = module.exports = new aclHelper();
