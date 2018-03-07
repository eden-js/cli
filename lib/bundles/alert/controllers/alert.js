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
 *
 * @priority 80
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
    this._render     = this._render.bind (this);
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

    // view hooks
    this.eden.pre ('view.render', this._render);
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
    let Alert = await alert.findById (data.id);

    // check alert
    if (!Alert) return;

    // send done
    this.__done (Alert);
  }

  /**
   * create helper functions
   *
   * @param {Object} render
   */
  async _render ({ req, res, render }) {
    // get alerts
    let Alerts = await alert.where ({
      'done' : false
    }).or ({
      'user.id' : req.user ? req.user.get ('_id').toString () : 'no.user'
    }, {
      'session' : req.sessionID
    }).find ();

    // set content
    render.alerts = await Promise.all (Alerts.map ((Alert) => Alert.sanitise ()));

    // loop alerts
    Alerts.forEach (this.__done);
  }

  /**
   * on connect socket
   *
   * @param {Object} data
   *
   * @private
   */
  async _connect (data) {
    // check for alerts
    let Alerts = await alert.where ({
      'done' : false
    }).or ({
      'user.id' : data.user ? data.user.get ('_id').toString () : 'no.user'
    }, {
      'session' : data.sessionID
    }).find ();

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
      return alertHelper[req.user ? 'user' : 'session'] (req.user ? req.user : req.sessionID, ...args, 'request');
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
    if (!(Alert.get ('opts') || {}).keep) return await Alert.remove ();

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
