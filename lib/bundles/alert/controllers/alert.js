// use strict
'use strict';

// require dependencies
const socket     = require ('socket');
const controller = require ('controller');

// require models
const user  = model ('user');
const alert = model ('alert');

// require helpers
const alertHelper = helper ('alert');

/**
 * build alert controller
 */
class alertController extends controller {
  /**
   * construct example controller class
   */
  constructor () {
    // run super eden
    super ();

    // bind private methods
    this._sent       = this._sent.bind (this);
    this._connect    = this._connect.bind (this);
    this._middleware = this._middleware.bind (this);

    // bind super private methods
    this.__done = this.__done.bind (this);

    // run middleware
    this.eden.router.use (this._middleware);

    // run on sent
    this.eden.on ('socket.connect',   this._connect);
    this.eden.on ('socket.user.sent', this._sent);
  }

  /**
   * do sent
   *
   * @param {Object} data
   *
   * @private
   */
  async _sent (data) {
    // check if id
    if (!data || !data.id) return;

    // get alert
    var Alert = await alert.findById (data.id);

    // check alert
    if (!Alert) return;

    // send done
    this.__done (Alert);
  }

  /**
   * on connect socket
   *
   * @param {Object} data
   *
   * @private
   */
  async _connect (data) {
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
      this.__done (Alert);
    }
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
    req.alert = async (type, opts) => {
      // check if user
      if (req.user) {
        // send user alert
        return await alertHelper.user (req.user, type, opts);
      } else {
        // send user alert
        return await socket.session (req.sessionID, 'alert', {
          'type' : type,
          'opts' : opts
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
   *
   * @private
   */
  async __done (Alert) {
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
exports = module.exports = alertController;
