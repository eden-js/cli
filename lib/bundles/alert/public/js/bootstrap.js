
// require riot
const riot = require ('riot');

// require dependencies
const socket = require ('socket/public/js/bootstrap');

/**
 * build alert class
 */
class alert {
  /**
   * construct edenAlert class
   */
  constructor () {
    // set observable
    riot.observable (this);

    // set variables
    this.alerts = [];

    // set private variables
    this._notify = (typeof window.Notification !== 'undefined' && window.Notification.permission === 'granted');

    // bind methods
    this.emit   = this.emit.bind (this);
    this.alert  = this.emit.bind (this); // @todo remove
    this.notify = this.notify.bind (this);

    // add alert type functions
    this.error = (opts) => {
      // emit error
      this.emit ('error', opts);
    };
    this.info = (opts) => {
      // emit error
      this.emit ('info', opts);
    };
    this.success = (opts) => {
      // emit error
      this.emit ('success', opts);
    };
    this.warning = (opts) => {
      // emit error
      this.emit ('warning', opts);
    };

    // bind private methods
    this._register = this._register.bind (this);

    // run alert on socket Event
    socket.on ('alert', data => {
      // run alert
      this.emit (data.type, data.opts);
    });

    // run alert on socket Event
    socket.on ('notify', (title, opts) => {
      // run alert
      this.notify (title, opts);
    });

    // run notification
    if (!this._notify && typeof window.Notification !== 'undefined' &&  window.Notification.permission !== 'denied') this._register ();
  }

  /**
   * alert user
   *
   * @param {String} type
   * @param {String} message
   * @param {Object} opts
   */
  emit (type, opts) {
    // set opts
    opts = typeof opts === 'string' ? {
      'text' : opts
    } : opts;

    // set opts
    opts.type     = type === 'error' ? 'danger' : type;
    opts.close    = () => {
      // set visible
      opts.visible = false;

      // update
      this.trigger ('update');

      // timeout remove
      setTimeout (() => {
        // loop this alerts
        for (var i = 0; i < this.alerts.length; i++) {
          // check alert
          if (this.alerts[i].id === opts.id) {
            // remove alert
            this.alerts.splice (i, 1);

            // update
            return this.trigger ('update');
          }
        }
      }, 200);
    };
    opts.visible  = true;
    opts.position = opts.position || 'top-right';

    // check id
    if (!opts.id) opts.id = this._uuid ();

    // check if window active
    if (document.hidden && this._notify) {
      // document is hidden
      return this.notify (type.charAt (0).toUpperCase () + type.substr (1), {
        'body' : opts.text,
        'icon' : opts.icon || window.eden.config.logo
      });
    }

    // timeout
    if (opts.timeout !== false) opts.timeout = setTimeout (opts.close, opts.timeout || 5000);

    // add to position
    this.alerts.push (opts);

    // trigger update
    this.trigger ('update');
  }

  /**
   * push message to notificactions
   *
   * @param {String} title
   * @param {Object} opts
   */
  notify (title, opts) {
    // set opts
    opts = opts || {};

    // check for notify
    if (!this._notify) return;

    // set icon
    opts.icon = opts.icon || window.eden.config.logo;

    // do notification
    new window.Notification (title, opts);
  }

  /**
   * returns unique identifier
   */
  _uuid () {
    // create seed 4 function
    let s4 = () => {
      // return random digits
      return Math.floor ((1 + Math.random ()) * 0x10000)
        .toString (16)
        .substring (1);
    };

    // return random string
    return s4 () + s4 () + '-' + s4 () + '-' + s4 () + '-' + s4 () + '-' + s4 () + s4 () + s4 ();
  }

  /**
   * register for notifications
   *
   * @private
   */
  _register () {
    // request notification permission
    Notification.requestPermission ().then (() => {
      // set notify
      this._notify = (typeof window.Notification !== 'undefined' && Notification.permission === 'granted');
    });
  }
}

/**
 * build alert class
 *
 * @type {edenAlert}
 */
window.eden.alert = new alert ();

/**
 * export alert class
 *
 * @type {alert}
 */
exports = module.exports = window.eden.alert;
