// Require dependencies
const socket = require('socket');

// Require local class dependencies
const Controller = require('controller');

// Require model classes
const Alert = model('alert');

// Require helpers
const alertHelper = helper('alert');

/**
 * Create Alert Controller class
 *
 * @priority 80
 */
class AlertController extends Controller {

  /**
   * Construct Alert Controller class
   */
  constructor () {
    // Run super
    super();

    // Bind public methods
    this.build = this.build.bind(this);

    // Bind private methods
    this._sent       = this._sent.bind(this);
    this._render     = this._render.bind(this);
    this._connect    = this._connect.bind(this);
    this._middleware = this._middleware.bind(this);

    // Bind super private methods
    this.__done = this.__done.bind(this);

    // Run build
    this.building = this.build();
  }

  /**
   * Build Alert Controller
   */
  build () {
    // Run middleware
    this.eden.router.use(this._middleware);

    // Run on sent
    this.eden.on('socket.connect',   this._connect);
    this.eden.on('socket.user.sent', this._sent);

    // Hooks
    this.eden.pre('socket.call.opts',     this._socket);
    this.eden.pre('socket.endpoint.opts', this._socket);

    // View hooks
    this.eden.pre('view.render', this._render);
  }

  /**
   * Do sent
   *
   * @param {object} data
   *
   * @private
   *
   * @async
   */
  async _sent (data) {
    // Check if id
    if (!data || !data.id) return;

    // Get alert
    const alert = await Alert.findById(data.id);

    // Check alert
    if (!alert) return;

    // Send done
    this.__done(alert);
  }

  /**
   * Create helper functions
   *
   * @param {Request}  req
   * @param {Response} res
   * @param {object}   render
   *
   * @async
   */
  async _render ({ req, res, render }) {
    // Get alerts
    const alerts = await Alert.where({
      'done' : false
    }).or({
      'user.id' : req.user ? req.user.get('_id').toString() : 'no.user'
    }, {
      'session' : req.sessionID
    }).find();

    // Set content
    render.alerts = await Promise.all(alerts.map((alert) => {
      return alert.sanitise();
    }));

    // Loop alerts
    alerts.forEach(this.__done);
  }

  /**
   * On connect socket
   *
   * @param {object} data
   *
   * @private
   *
   * @async
   */
  async _connect (data) {
    // Check for alerts
    const alerts = await Alert.where({
      'done' : false
    }).or({
      'user.id' : data.user ? data.user.get('_id').toString() : 'no.user'
    }, {
      'session' : data.sessionID
    }).find();

    // Loop alerts
    alerts.forEach(async (alert) => {
      // Emit to redis
      socket[await alert.get('user') ? 'user' : 'session'](await alert.get('user') || alert.get('session'), 'alert', await alert.sanitise());

      // Send done
      this.__done(alert);
    });
  }

  /**
   * Socket opts middleware
   *
   * @param {object} opts
   */
  _socket (opts) {
    // Create alert function
    opts.alert = (...args) => {
      // Return helper alert
      return alertHelper.socket(opts.socket, ...args, 'socket');
    };
  }

  /**
   * Build middleware
   *
   * @param {request}  req Express request
   * @param {response} res Express response
   * @param {function} next Next callback
   *
   * @private
   */
  _middleware (req, res, next) {
    // Create alert function
    req.alert = res.alert = (type = 'error', message = '', opts = {}) => {
      // Return helper alert
      return alertHelper[req.user ? 'user' : 'session'](req.user ? req.user : req.sessionID, type, message, opts, 'request');
    };

    // Run next
    next();
  }

  /**
   * Checks and saves sent alert
   *
   * @param  {Alert} alert
   *
   * @return {*}
   */
  async __done (alert) {
    // Check if should keep
    if (!(alert.get('opts') || {}).keep) return await alert.remove();

    // Set done
    alert.set('done', true);

    // Save alert
    await alert.save();
  }

}

/**
 * Export Alert Controller class
 *
 * @type {AlertController}
 */
exports = module.exports = AlertController;
