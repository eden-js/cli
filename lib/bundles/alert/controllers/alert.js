// use strict
'use strict';

// require dependencies
const socket     = require ('socket');
const controller = require ('controller');

// require local dependencies
const user   = require ('user/models/user');
const alert  = require ('alert/models/alert');
const helper = require ('alert/helpers/alert');

/**
 * build alert controller
 */
class alertController extends controller {
  /**
   * construct example controller class
   *
   * @param {eden} eden
   */
  constructor (eden) {
    // run super eden
    super (eden);

    // build app
    this.done       = this.done.bind (this);
    this.sent       = this.sent.bind (this);
    this.connect    = this.connect.bind (this);
    this.middleware = this.middleware.bind (this);

    // run middleware
    eden.router.use (this.middleware);

    // run on sent
    eden.on ('socket:connect', this.connect);
    eden.on ('socket:user:sent', this.sent);
  }

  /**
   * do sent
   *
   * @param {Object} data
   */
  async sent (data) {
    // check if id
    if (!data || !data.id) return;

    // get alert
    var Alert = await alert.findById (data.id);

    // check alert
    if (!Alert) return;

    // send done
    this.done (Alert);
  }

  /**
   * on connect socket
   *
   * @param {Object} data
   */
  async connect (data) {
    // check if user
    if (!data.user) return;

    // get user
    var User = await user.findById (data.user);

    // check user
    if (!User) return;

    // check for alerts
    var Alerts = await alert.where ({
      'user.id' : User.get ('_id').toString ()
    }).find ();

    // loop alerts
    for (var i = 0; i < Alerts.length; i++) {
      // let alert
      let Alert = Alerts[i];

      // emit to redis
      socket.user (User, 'alert', await Alert.sanitise ());

      // send done
      this.done (Alert);
    }
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
    req.alert = async (type, message, opts) => {
      // check if user
      if (req.user) {
        // send user alert
        return await helper.user (req.user, type, message, opts);
      } else {
        // send user alert
        return await socket.session (req.sessionID, 'alert', {
          'type'    : type,
          'message' : message,
          'options' : opts
        });
      }
    };

    // run next
    next ();
  }

  /**
   * checks and saves sent alert
   *
   * @param {alert} Alert
   */
  async done (Alert) {
    // check if should keep
    if (!(Alert.get ('options') || {}).keep) return await Alert.remove ();

    // set done
    Alert.set ('done', true);

    // save alert
    await Alert.save ();
  }
}

/**
 * export alert controller
 *
 * @type {alertController}
 */
module.exports = alertController;
