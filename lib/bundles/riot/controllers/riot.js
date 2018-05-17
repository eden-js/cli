// Use strict


// Require dependencies
const socket     = require('socket');
const controller = require('controller');

/**
 * Build alert controller
 */
class riotController extends controller {

  /**
   * Construct example controller class
   */
  constructor () {
    // Run super
    super();

    // Bind private methods
    this._middleware = this._middleware.bind(this);

    // Run middleware
    this.eden.router.use(this._middleware);
  }

  /**
   * Build middleware
   *
   * @param  {request}  req Express request
   * @param  {response} res Express response
   * @param  {function} next Next callback
   *
   * @private
   */
  async _middleware (req, res, next) {
    // Create alert function
    req.state = async (opts) => {
      // Send user alert
      return await socket[req.user ? 'user' : 'session'](req.user || req.sessionID, 'state', {
        'url'  : req.url,
        'opts' : opts
      });
    };

    // Run next
    next();
  }
}

/**
 * Export alert controller
 *
 * @type {alertController}
 */
exports = module.exports = riotController;
