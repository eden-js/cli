// use strict
'use strict';

// require dependencies
const socket     = require ('socket');
const controller = require ('controller');

/**
 * build alert controller
 */
class riotController extends controller {
  /**
   * construct example controller class
   */
  constructor () {
    // run super
    super ();

    // bind private methods
    this._middleware = this._middleware.bind (this);

    // run middleware
    this.eden.router.use (this._middleware);
  }

  /**
   * build middleware
   *
   * @param  {request}  req Express request
   * @param  {response} res Express response
   * @param  {function} next Next callback
   *
   * @private
   */
  async _middleware (req, res, next) {
    // create alert function
    req.state = async (opts) => {
        // send user alert
      return await socket[req.user ? 'user' : 'session'] (req.user || req.sessionID, 'state', {
        'url'  : req.url,
        'opts' : opts
      });
    };

    // run next
    next ();
  }
}

/**
 * export alert controller
 *
 * @type {alertController}
 */
exports = module.exports = riotController;
