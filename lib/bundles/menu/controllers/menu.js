
// Require dependencies
const controller = require('controller');

// Require helpers
const menuHelper = helper('menu');

// Require cache
const menuConfig = cache('menus');

/**
 * Build menu controller
 *
 * @priority 5
 */
class menu extends controller {

  /**
   * Construct home controller
   */
  constructor () {
    // Run super
    super();

    // Bind methods
    this.build = this.build.bind(this);

    // Bind private methods
    this._menus = this._menus.bind(this);

    // Build eden
    this.build();
  }

  /**
   * Build app
   *
   * @param {express} app
   */
  build () {
    // On render
    this.eden.pre('view.compile', (render) => {
      // Return
      if (render.isJSON) return;

      // Move menus
      if (render.state.menus) render.menus = render.state.menus;

      // Loop menu
      (Object.keys(render.menus) || []).forEach((key) => {
        // Get classes
        render.menus[key].sort((a, b) => {
          // Return sort
          return b.priority === a.priority ? 0 : (b.priority < a.priority ? -1 : 1);
        });
      });

      // Delete from state
      delete render.state.menus;
    });

    // Set app
    this.eden.router.use(async (req, res, next) => {
      // Set req remove
      req.menu = {};

      // Set menus
      res.locals.menus = await this._menus(req.user, menuConfig);

      // Add function
      req.menu.create = (type, route, item) => {
        // Add menu item
        menuHelper.create(type, route, item, res);

        // Return
        return req.menu;
      };

      // Edit function
      req.menu.update = (type, route, item) => {
        // Edit menu item
        menuHelper.update(type, route, item, res);

        // Return
        return req.menu;
      };

      // Remove function
      req.menu.remove = (type, route) => {
        // Remove menu item
        menuHelper.remove(type, route, res);

        // Return
        return req.menu;
      };

      // Run next
      next();
    });
  }


  /**
   * Returns menus
   *
   * @param {user} User
   * @param {Array} menus
   *
   * @return {Array}
   */
  async _menus (User, menus) {
    // Clone menus
    let Menus = JSON.parse(JSON.stringify(menus));

    // Add hook
    await this.eden.hook('menus.init', Menus);

    // Loop menu types
    for (let type in Menus) {
      // Check property
      if (!Menus.hasOwnProperty(type)) continue;

      // Set routes
      let Routes = [];

      // Set menu
      Menus[type] = Menus[type] || [];

      // Loop actual menus
      for (let i = (Menus[type].length - 1); i >= 0; i--) {
        // Check routes
        if (Routes.includes(Menus[type][i].route)) {
          // Delete from menu
          Menus[type].splice(i, 1);

          // Continue
          continue;
        }

        // Push to routes
        Routes.push(Menus[type][i].route);
      }

      // Check menu type
      if (!Menus[type].length) {
        // Remove menu
        delete Menus[type];

        // Continue
        continue;
      }
    }

    // Return menus
    return Menus;
  }
}

/**
 * Export menu controller
 *
 * @type {menu}
 */
exports = module.exports = menu;
