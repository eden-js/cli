// use strict
'use strict';

// require dependencies
const config     = require ('config');
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

    // bind methods
    this.build = this.build.bind (this);

    // bind private methods
    this._sent       = this._sent.bind (this);
    this._connect    = this._connect.bind (this);
    this._middleware = this._middleware.bind (this);

    // bind super private methods
    this.__done = this.__done.bind (this);

    // build
    this.building = this.build ();
  }

  /**
   * build alert controller
   */
  build () {
    // run middleware
    this.eden.router.use (this._middleware);

    // run on sent
    this.eden.on ('socket.connect',   this._connect);
    this.eden.on ('socket.user.sent', this._sent);

    // hooks
    this.eden.pre ('socket.call.opts',     this._socket);
    this.eden.pre ('socket.endpoint.opts', this._socket);
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
    var Alerts = await alert.find ({
      '$or' : [
        {
          'user.id' : User.get ('_id').toString ()
        },
        {
          'session' : data.sessionID
        }
      ]
    });

    // loop alerts
    Alerts.forEach (async (Alert) => {
      // emit to redis
      socket[await Alert.get ('user') ? 'user' : 'session'] (await Alert.get ('user') || Alert.get ('session'), 'alert', await Alert.sanitise ());

      // send done
      this.__done (Alert);
    });
  }

  /**
   * socket opts middleware
   *
   * @param  {Object} opts
   */
  _socket (opts) {
    // create alert function
    opts.alert = (...args) => {
      // return helper alert
      return alertHelper.socket (opts.socket, ...args, 'socket');
    };
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
    req.alert = res.alert = (...args) => {
      // return helper alert
      return alertHelper.session (req.sessionID, ...args, 'request');
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
