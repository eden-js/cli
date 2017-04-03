/**
 * Created by Awesome on 3/5/2016.
 */

// use strict
'use strict';

// require dependencies
const helper = require ('helper');

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
    this.create = this.create.bind (this);
    this.update = this.update.bind (this);
    this.remove = this.remove.bind (this);
  }

  /**
   * create menu from res
   *
   * @param {String} route
   * @param {Object} item
   * @param {Object} res
   */
  create (type, route, item, res) {
    // check if type
    if (!res.locals.menus || !res.locals.menus[type]) return;

    // @todo complete and test this logic
    console.log (route);
  }

  /**
   * update from res
   *
   * @param {String} route
   * @param {Object} item
   * @param {Object} res
   */
  update (type, route, item, res) {
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
exports = module.exports = new menuHelper ();
