/**
 * Created by Awesome on 3/5/2016.
 */

// use strict
'use strict';

// require dependencies
const helper = require ('helper');

// require local dependencies
const menus = cache ('menus');

/**
 * build menu helper class
 */
class menuHelper extends helper {
  /**
   * construct datagrid helper
   */
  constructor () {
    // run super
    super ();

    // add menu
    this.add    = this.add.bind (this);
    this.edit   = this.edit.bind (this);
    this.remove = this.remove.bind (this);
  }

  /**
   * remove menu from res
   *
   * @param {String} route
   * @param {Object} item
   * @param {Object} res
   */
  add (type, route, item, res) {
    // check if type
    if (!res.locals.menus || !res.locals.menus[type]) return;

    console.log (route);
  }

  /**
   * remove menu from res
   *
   * @param {String} route
   * @param {Object} item
   * @param {Object} res
   */
  edit (type, route, item, res) {
    // check if type
    if (!res.locals.menus || !res.locals.menus[type]) return;

    // loop menus
    for (var i = (res.locals.menus[type].length - 1); i >= 0; i--) {
      // remove menu if it is this
      if (res.locals.menus[type][i].route === route) {
        // loop item changes
        for (var key in item) {
          // alter menu item
          res.locals.menus[type][i][key] = item[key];
        }
      }
    }
  }

  /**
   * remove menu from res
   *
   * @param {String} route
   * @param {Object} res
   */
  remove (type, route, res) {
    // check if type
    if (!res.locals.menus || !res.locals.menus[type]) return;

    // loop menus
    for (var i = (res.locals.menus[type].length - 1); i >= 0; i--) {
      // remove menu if it is this
      if (res.locals.menus[type][i].route === route) res.locals.menus[type].splice (i, 1);
    }
  }
}

/**
 * export built menu helper
 *
 * @return {menuHelper}
 */
module.exports = new menuHelper ();
