
// require dependencies
const socket     = require ('socket');
const controller = require ('controller');

/**
 * build socket controller
 */
class socketController extends controller {

  /**
   * construct socket controller class
   */
  constructor () {
    // run super
    super ();

    // build app
    this.middleware = this.middleware.bind (this);

    // run middleware
    this.eden.router.use (this.middleware);
  }

  /**
   * build middleware
   *
   * @param  {request}  req Express request
   * @param  {response} res Express response
   * @param  {function} next Next callback
   */
  middleware (req, res, next) {
    // create alert function
    req.socketEmit = (type, data) => {
      // emit to user
      if (req.user) {
        return socket.user (req.user, type, data);
      } else {
        return socket.session (req.sessionID, type, data);
      }
    };

    // run next
    next ();
  }
}

/**
 * export socket controller
 *
 * @type {socketController}
 */
exports = module.exports = socketController;
