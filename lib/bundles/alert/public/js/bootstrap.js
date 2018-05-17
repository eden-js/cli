// Require class dependencies
const EventEmitter = require('events');

// Require local dependencies
const store  = require('default/public/js/store');
const socket = require('socket/public/js/bootstrap');

/**
 * Create Alert class
 */
class Alert extends EventEmitter {

  /**
   * Construct Alert class
   */
  constructor () {
    // Run super
    super(...arguments);

    // Set public variables
    this.alerts = [];

    // Set private variables
    this._alerts = this._alerts.bind(this);
    this._notify = (typeof window.Notification !== 'undefined' && window.Notification.permission === 'granted');

    // Bind public methods
    this.alert  = this.alert.bind(this); // @todo remove
    this.notify = this.notify.bind(this);

    // Add alert error function
    this.error = (opts) => {
      // Emit error
      this.alert('error', opts);
    };

    // Add alert info function
    this.info = (opts) => {
      // Emit info
      this.alert('info', opts);
    };

    // Add alert success function
    this.success = (opts) => {
      // Emit success
      this.alert('success', opts);
    };

    // Add alert warning function
    this.warning = (opts) => {
      // Emit warning
      this.alert('warning', opts);
    };

    // Bind private methods
    this._register = this._register.bind(this);

    // Run alert on socket event
    socket.on('alert', async (data) => {
      // Run alert hook
      await store.hook('alert', data);

      // Run alert
      if (!data.prevent) this.alert(data.type, data.opts);
    });

    // Run alert on socket event
    socket.on('notify', async (title, opts) => {
      // Hook alert
      await store.hook('notify', opts);

      // Run alert
      if (!opts.prevent) this.notify(title, opts);
    });

    // Register notification
    if (!this._notify && typeof window.Notification !== 'undefined' &&  window.Notification.permission !== 'denied') this._register();

    // On alerts
    store.on('alerts', this._alerts);

    // Initialize alerts
    this._alerts(store.get('alerts'));
  }

  /**
   * Alert user
   *
   * @param   {string} type
   * @param   {object} opts
   *
   * @returns {*}
   *
   * @async
   */
  async alert (type, opts) {
    // Set opts
    opts = typeof opts === 'string' ? {
      'text' : opts
    } : opts;

    // Set opts type
    opts.type  = type === 'error' ? 'danger' : type;

    // Set opts close function
    opts.close = () => {
      // Set visible
      opts.visible = false;

      // Emit update
      this.emit('update');

      // Timeout remove
      setTimeout(() => {
        // Loop alerts
        for (let i = 0; i < this.alerts.length; i++) {
          // Check alert
          if (this.alerts[i].id === opts.id) {
            // Remove alert
            this.alerts.splice(i, 1);

            // Emit update
            return this.emit('update');
          }
        }
      }, 200);
    };

    // Set opts visible and position
    opts.visible  = true;
    opts.position = opts.position || 'top-right';

    // Check id
    if (!opts.id) opts.id = this._uuid();

    // Run alert compile hook
    await store.hook('alert.compile', type, opts);

    // Check if window active
    if (document.hidden && this._notify && opts.display !== 'alert') {
      // Document is hidden
      return this.notify(type.charAt(0).toUpperCase() + type.substr(1), {
        'body' : opts.text,
        'icon' : opts.icon || window.eden.config.logo
      });
    }

    // Timeout
    if (opts.timeout !== false) opts.timeout = setTimeout(opts.close, opts.timeout || 5000);

    // Add to position
    this.alerts.push(opts);

    // Emit update
    this.emit('update');
  }

  /**
   * Push message to notifications
   *
   * @param {string} title
   * @param {object} opts
   */
  notify (title, opts) {
    // Set opts
    opts = opts || {};

    // Check for notify
    if (!this._notify) return;

    // Set icon
    opts.icon = opts.icon || window.eden.config.logo;

    // Do notification
    new window.Notification(title, opts);
  }

  /**
   * Returns unique identifier
   *
   * @returns {string}
   */
  _uuid () {
    // Create seed 4 function
    const s4 = () => {
      // Return random digits
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    };

    // Return random string
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }

  /**
   * Run alerts
   *
   * @param {array} alerts
   */
  _alerts (alerts) {
    // Loop alerts
    alerts.forEach(async (data) => {
      // Hook alert
      await store.hook('alert', data);

      // Run alert
      if (!data.prevent) this.alert(data.type, data.opts);
    });
  }

  /**
   * Register for notifications
   *
   * @private
   */
  _register () {
    // Request notification permission
    Notification.requestPermission().then(() => {
      // Set notify
      this._notify = (typeof window.Notification !== 'undefined' && Notification.permission === 'granted');
    });
  }

}

/**
 * Set window's new Alert instance
 *
 * @type {Alert}
 */
window.eden.alert = new Alert();

/**
 * Export Alert instance
 *
 * @type {Alert}
 */
exports = module.exports = window.eden.alert;
