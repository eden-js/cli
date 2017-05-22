
/**
 * build acl class
 */
class aclUtil {
  /**
   * construct acl class
   */
  constructor () {
    // bind methods
    this.list       = this.list.bind (this);
    this.validate   = this.validate.bind (this);
    this.middleware = this.middleware.bind (this);
  }

  /**
   * validates acl list against user
   *
   * this method will return false if the user does not have access to a certain
   * acl list, to check an acl against a user simply:
   *   await aclUtil.validate (User, ['user.view', 'user.create'])
   *    OR
   *   await aclUtil.validate (User, 'user.view')
   *
   * @param {user} User
   * @param {*}    test
   *
   * @return {Promise}
   */
  async validate (User, test) {
    // get list
    let list = await this.list (User);

    // set array if not
    if (!Array.isArray (test)) test = [test];

    // loop list
    for (var i = 0; i < test.length; i++) {
      // check if user
      if (test[i] === true || test[i] === false) {
        // check user
        if ((test[i] === true && !User) || (test[i] === false && User)) {
          return false;
        } else {
          continue;
        }
      }

      // check if list is true
      if (list === true) return true;

      // var area
      let area = test[i].split ('.');
      area.pop ();
      area = area.join ('.');

      // check against user acl
      if (list.indexOf (test[i]) === -1 && list.indexOf (area + '.*') === -1) {
        // return false
        return false;
      }
    }

    // return true
    return true;
  }

  /**
   * lists and flattens acl applied to a user
   *
   * this method will return an array of group acls associated with a particular
   * user, to use this method simply:
   *    await aclUtil.list (User)
   *
   * if this method returns `true` this means the user is a super administrator
   *
   * @param {user} User
   *
   * @return {Array|Boolean}
   * @private
   */
  async list (User) {
    // return array if no user
    if (!User) return [];

    // get groups
    let acls = [];
    let Acls = await User.model ('acl') || [];

    // loop Acls
    for (var a = 0; a < Acls.length; a++) {
      // check if get
      if (!Acls[a] || !Acls[a].get) {
        continue;
      }

      // check acl index
      if (Acls[a].get ('value') === true) return true;

      // loop values
      for (var b = 0; b < Acls[a].get ('value').length; b++) {
        // check if already in Array
        if (acls.indexOf (Acls[a].get ('value')[b]) === -1) {
          // push into acls
          acls.push (Acls[a].get ('value')[b]);
        }
      }
    }

    // return acls
    return acls;
  }

  /**
   * expressjs middleware for checking route acl against the current user
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
    // check route has acl
    if (!res.locals.route || !res.locals.route.acl || !res.locals.route.acl.length) return true;

    // check acl
    let check = await this.validate (req.user, res.locals.route.acl);

    // check if true
    if (!check) {
      // check if redirect
      if (res.locals.route.fail) {
        // check if next
        if (res.locals.route.fail === 'next') {
          // return false
          return 0;
        }

        // redirect to fail auth redirect
        res.redirect (res.locals.route.fail);

        // return false
        return 2;
      }

      // redirect home
      res.redirect ('/');

      // return false
      return 2;
    }

    // do next
    return 1;
  }
}

/**
 * export aclUtil class
 *
 * @type {aclUtil}
 */
exports = module.exports = new aclUtil ();
