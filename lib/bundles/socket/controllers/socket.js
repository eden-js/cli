
// Require dependencies
const socket     = require('socket');
const controller = require('controller');

/**
 * Build socket controller
 */
class socketController extends controller {

  /**
   * Construct socket controller class
   */
  constructor () {
    // Run super
    super();

    // Build app
    this.middleware = this.middleware.bind(this);

    // Run middleware
    this.eden.router.use(this.middleware);
  }

  /**
   * Build middleware
   *
   * @param  {request}  req Express request
   * @param  {response} res Express response
   * @param  {function} next Next callback
   */
  middleware (req, res, next) {
    // Create alert function
    req.socketEmit = (type, data) => {
      // Emit to user
      if (req.user) {
        return socket.user(req.user, type, data);
      } else {
        return socket.session(req.sessionID, type, data);
      }
    };

    // Run next
    next();
  }
}

/**
 * Export socket controller
 *
 * @type {socketController}
 */
exports = module.exports = socketController;
