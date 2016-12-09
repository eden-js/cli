// use strict
'use strict';

// require dependencies
var socket     = require ('socket');
var controller = require ('controller');

/**
 * build socket controller
 */
class socketController extends controller {
  /**
   * construct socket controller class
   *
   * @param {eden} eden
   */
  constructor (eden) {
    // run super eden
    super (eden);

    // build app
    this.middleware = this.middleware.bind (this);

    // run middleware
    eden.app.use (this.middleware);
  }

  /**
   * build middleware
   *
   * @param  {request}  req Express request
   * @param  {response} res Express response
   * @param  {function} next Next callback
   */
  async middleware (req, res, next) {
    // create alert function
    req.emit = (type, data) => {
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
module.exports = socketController;
