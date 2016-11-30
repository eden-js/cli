/**
 * Created by Awesome on 2/28/2016.
 */

// use strict
'use strict';

// require local dependencies
var config = require ('app/cache/config.json').acl;

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
    // check test
    if (test === true  && User)  return true;
    if (test === false && !User) return true;

    // get list
    var list = await this.list (User);

    // check if list is true
    if (list === true) return true;

    // loop list
    for (var i = 0; i < test.length; i++) {
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
   */
  async middleware (req, res, next) {
    // get route
    var route = '/' + res.locals.path.replace (/^\/|\/$/g, '');

    // check route has acl
    if (!config[route] || !config[route].length) return next ();

    // loop acl for tests
    for (var i = 0; i < config[route].length; i ++) {
      // check acl
      var check = await this.validate (req.user, config[route][i]);

      // check if true
      if (!check) {
        // check if redirect
        if (config[route][i].redirect) {
          // redirect to fail auth redirect
          return res.redirect (config[route][i].redirect);
        }

        // redirect home
        return res.redirect ('/');
      }
    }

    // do next
    next ();
  }
}

/**
 * export aclUtil class
 *
 * @type {aclUtil}
 */
module.exports = new aclUtil ();
