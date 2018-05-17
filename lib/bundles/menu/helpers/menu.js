
// Require dependencies
const helper = require('helper');

/**
 * Build menu helper class
 */
class menuHelper extends helper {

  /**
   * Construct datagrid helper
   */
  constructor () {
    // Run super
    super();

    // Add menu
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.remove = this.remove.bind(this);
  }

  /**
   * Create menu from res
   *
   * @param {String} route
   * @param {Object} item
   * @param {Object} res
   */
  create (type, route, item, res) {
    // Check if type
    if (!res.locals.menus || !res.locals.menus[type]) return;

    // @todo complete and test this logic
    console.log(route);
  }

  /**
   * Update from res
   *
   * @param {String} route
   * @param {Object} item
   * @param {Object} res
   */
  update (type, route, item, res) {
    // Check if type
    if (!res.locals.menus || !res.locals.menus[type]) return;

    // Loop menus
    for (let i = (res.locals.menus[type].length - 1); i >= 0; i--) {
      // Remove menu if it is this
      if (res.locals.menus[type][i].route === route) {
        // Loop item changes
        for (let key in item) {
          // Alter menu item
          res.locals.menus[type][i][key] = item[key];
        }
      }
    }
  }

  /**
   * Remove menu from res
   *
   * @param {String} route
   * @param {Object} res
   */
  remove (type, route, res) {
    // Check if type
    if (!res.locals.menus || !res.locals.menus[type]) return;

    // Loop menus
    for (let i = (res.locals.menus[type].length - 1); i >= 0; i--) {
      // Remove menu if it is this
      if (res.locals.menus[type][i].route === route) res.locals.menus[type].splice(i, 1);
    }
  }
}

/**
 * Export built menu helper
 *
 * @return {menuHelper}
 */
exports = module.exports = new menuHelper();
