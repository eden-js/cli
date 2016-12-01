/**
 * Created by Awesome on 3/5/2016.
 */

// use strict
'use strict';

// require dependencies
var helper = require ('helper');

// require local dependencies
var menus = require ('app/cache/menus.json');

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
  add (route, item, res) {
    console.log (route);
  }

  /**
   * remove menu from res
   *
   * @param {String} route
   * @param {Object} item
   * @param {Object} res
   */
  edit (route, item, res) {
    console.log (route);
  }

  /**
   * remove menu from res
   *
   * @param {String} route
   * @param {Object} res
   */
  remove (route, res) {
    console.log (route);
  }
}

/**
 * export built menu helper
 *
 * @return {menuHelper}
 */
module.exports = new menuHelper ();
