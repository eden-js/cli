// Require local dependencies
const eden = require('eden');

// Require local class dependencies
const Helper = require('helper');

/**
 * Create Route Helper class
 */
class RouteHelper extends Helper {

  /**
   * Construct Route Helper class
   */
  constructor () {
    // Run super
    super();

    // Set private variables
    this._creates = [];
    this._updates = [];
    this._removes = [];

    // Bind public methods
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.remove = this.remove.bind(this);

    // Bind private methods
    this._hook = this._hook.bind(this);

    // Bind super private methods
    this.__match = this.__match.bind(this);

    // Set on eden post-routes
    eden.post('eden.routes', this._hook);
  }

  /**
   * Creates route
   *
   * @param {object} route
   */
  create (route) {
    // Push route
    this._creates.push(route);
  }

  /**
   * Updates route
   *
   * @param {object} route
   */
  update (route) {
    // Push route
    this._updates.push(route);
  }

  /**
   * Removes route
   *
   * @param {object} route
   */
  remove (route) {
    // Push route
    this._removes.push(route);
  }

  /**
   * Runs hook
   *
   * @param {object[]} routes
   *
   * @private
   */
  _hook (routes) {
    // Loop creates
    for (let a = 0; a < this._creates.length; a++) {
      // Add to routes
      routes.push(this._creates[a]);
    }

    // Loop updates
    for (let b = 0; b < this._updates.length; b++) {
      // Find match
      if (this.__match(this._updates[b], routes)) continue;

      // Add to routes
      routes.push(this._updates[b]);
    }

    // Loop removes
    for (let c = 0; c < this._removes.length; c++) {
      // Find match
      const match = this.__match(this._removes[c], routes);

      // Check match
      if (match === -1) continue;

      // Splice out match
      routes.splice(match, 1);
    }
  }

  /**
   * Matches route
   *
   * @param   {object}   route
   * @param   {object[]} routes
   *
   * @returns {number}
   *
   * @private
   */
  __match (route, routes) {
    // Loop routes
    for (let i = 0; i < routes.length; i++) {
      // Check type, mount and route
      if (route.type  !== routes[i].type)  continue;
      if (route.mount !== routes[i].mount) continue;
      if (route.route !== routes[i].route) continue;

      // Set route
      routes[i] = route;

      // Return i
      return i;
    }

    // Return -1
    return -1;
  }

}

/**
 * Export new Route Helper instance
 *
 * @return {RouteHelper}
 */
exports = module.exports = new RouteHelper();
