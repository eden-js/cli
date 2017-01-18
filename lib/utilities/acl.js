/**
 * Created by Awesome on 2/28/2016.
 */

// use strict
'use strict';

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
   * validates acl
   *
   * @param {user} User
   * @param {*}    test
   */
  async validate (User, test) {
    // get list
    var list = await this.list (User);

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
      var area = test[i].split ('.');
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
   * gets acl list from user
   *
   * @param {user} User
   *
   * @private
   */
  async list (User) {
    // return array if no user
    if (!User) return [];

    // get groups
    var acls = [];
    var Acls = await User.model ('acl');

    // loop Acls
    for (var a = 0; a < Acls.length; a++) {
      // check if get
      if (!Acls[a].get) {
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
   * change acl middleware
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
    var check = await this.validate (req.user, res.locals.route.acl);

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
module.exports = new aclUtil ();
