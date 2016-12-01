/**
 * Created by Awesome on 2/17/2016.
 */

// use strict
'use strict';

// require dependencies
var controller = require ('controller');

// require local dependencies
var acl        = require ('lib/utilities/acl');
var menuConfig = require ('app/cache/menus.json');
var menuHelper = require ('menu/helpers/menu');

/**
 * build menu controller
 *
 * @priority 5
 */
class menu extends controller {
  /**
   * construct home controller
   *
   * @param {eden} eden
   */
  constructor (eden) {
    // run super
    super (eden);

    // bind methods
    this.build = this.build.bind (this);

    // bind private methods
    this._menus = this._menus.bind (this);

    // build eden
    this.build (eden.app);
  }

  /**
   * build app
   *
   * @param {express} app
   */
  build (app) {
    // set app
    app.use (async (req, res, next) => {
      // set req remove
      req.menu = {};

      // set menus
      res.locals.menus = await this._menus (req.user, menuConfig);

      // add function
      req.menu.add = async (route, item) => {
        // add menu item
        menuHelper.add (route, item, res);

        // set menus
        res.locals.menus = await this._menus (req.user, res.locals.menus);
      };

      // edit function
      req.menu.edit = async (route, item) => {
        // edit menu item
        menuHelper.edit (route, item, res);

        // set menus
        res.locals.menus = await this._menus (req.user, res.locals.menus);
      };

      // remove function
      req.menu.remove = async (route) => {
        // remove menu item
        menuHelper.remove (route, res);

        // set menus
        res.locals.menus = await this._menus (req.user, res.locals.menus);
      };

      // run next
      next ();
    });
  }


  /**
   * returns menus
   *
   * @param {user} User
   * @param {Array} menus
   *
   * @return {Array}
   */
  async _menus (User, menus) {
    // clone menus
    var Menus = JSON.parse (JSON.stringify (menus));

    // loop menu types
    for (var type in Menus) {
      // set routes
      var Routes = [];

      // set menu
      Menus[type] = Menus[type] || [];

      // get classes
      Menus[type].sort ((a, b) => {
        // return sort
        return b.priority - a.priority;
      });

      // loop actual menus
      for (var i = Menus[type].length; i >= 0; i--) {
        // continue if menu gone
        if (!Menus[type][i]) {
          // delete from menu
          Menus[type].splice (i, 1);

          // continue
          continue;
        }

        // check routes
        if (Routes.indexOf (Menus[type][i].route) > -1) {
          // delete from menu
          Menus[type].splice (i, 1);

          // continue
          continue;
        }

        // push to routes
        Routes.push (Menus[type][i].route);

        // check if valid acl
        if (Menus[type][i].acl) {
          // validate acl
          if (!await acl.validate (User, Menus[type][i].acl)) {
            // delete from menu
            Menus[type].splice (i, 1);

            // continue
            continue;
          }
        }
      }

      // check menu type
      if (!Menus[type].length) {
        // remove menu
        delete Menus[type];

        // continue
        continue;
      }
    }

    // return menus
    return Menus;
  }
}

/**
 * export menu controller
 *
 * @type {menu}
 */
module.exports = menu;
