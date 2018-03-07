
// require dependencies
const controller = require ('controller');

// require helpers
const aclHelper  = helper ('user/acl');
const menuHelper = helper ('menu');

// require cache
const menuConfig = cache ('menus');

/**
 * build menu controller
 *
 * @priority 5
 */
class menu extends controller {

  /**
   * construct home controller
   */
  constructor () {
    // run super
    super ();

    // bind methods
    this.build = this.build.bind (this);

    // bind private methods
    this._menus = this._menus.bind (this);

    // build eden
    this.build ();
  }

  /**
   * build app
   *
   * @param {express} app
   */
  build () {
    // on render
    this.eden.pre ('view.compile', (render) => {
      // move menus
      if (render.state.menus) render.menus = render.state.menus;

      // loop menu
      (Object.keys (render.menus) || []).forEach ((key) => {
        // get classes
        render.menus[key].sort ((a, b) => {
          // return sort
          return b.priority === a.priority ? 0 : (b.priority < a.priority ? -1 : 1);
        });
      });

      // delete from state
      delete render.state.menus;
    });

    // set app
    this.eden.router.use (async (req, res, next) => {
      // set req remove
      req.menu = {};

      // set menus
      res.locals.menus = await this._menus (req.user, menuConfig);

      // add function
      req.menu.create = (type, route, item) => {
        // add menu item
        menuHelper.create (type, route, item, res);

        // return
        return req.menu;
      };

      // edit function
      req.menu.update = (type, route, item) => {
        // edit menu item
        menuHelper.update (type, route, item, res);

        // return
        return req.menu;
      };

      // remove function
      req.menu.remove = (type, route) => {
        // remove menu item
        menuHelper.remove (type, route, res);

        // return
        return req.menu;
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
    let Menus = JSON.parse (JSON.stringify (menus));

    // add hook
    await this.eden.hook ('menus.init', Menus);

    // loop menu types
    for (var type in Menus) {
      // check property
      if (!Menus.hasOwnProperty (type)) continue;

      // set routes
      let Routes = [];

      // set menu
      Menus[type] = Menus[type] || [];

      // loop actual menus
      for (var i = (Menus[type].length - 1); i >= 0; i--) {
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
          if (!await aclHelper.validate (User, Menus[type][i].acl)) {
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
exports = module.exports = menu;
