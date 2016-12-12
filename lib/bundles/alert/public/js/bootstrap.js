/**
 * Created by Awesome on 3/13/2016.
 */

// use strict
'use strict';

// require dependencies
var io     = require ('socket.io-client');
var socket = require ('socket/public/js/bootstrap');

/**
 * build edenAlert class
 */
class edenAlert {
  /**
   * construct edenAlert class
   */
  constructor () {
    // set local variables
    this._notify = (typeof window.Notification !== 'undefined' && window.Notification.permission === 'granted');

    // bind methods
    this.alert  = this.alert.bind (this);
    this.notify = this.notify.bind (this);

    // bind private methods
    this._reset = this._reset.bind (this);

    // bind notification
    this._register = this._register.bind (this);

    // run alert on socket Event
    socket.on ('alert', alert => {
      // run alert
      this.alert (alert.type, alert.message, alert.opts);
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
  alert (type, message, opts) {
    // set opts
    opts = opts || {};

    // check if window active
    if (document.hidden && this._notify) {
      // document is hidden
      return this.notify (type.charAt (0).toUpperCase () + type.substr (1), {
        'body' : message,
        'icon' : opts.icon || window.eden.config.logo
      });
    }

    // reset toastr options
    this._reset ();

    // loop options
    for (var key in opts) {
      // set options
      window.toastr[key] = opts[key];
    }

    // run alert
    if (window.toastr[type]) window.toastr[type] (message);
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
   * reset toastr options
   *
   * @private
   */
  _reset () {
    // set default options
    window.toastr.options = {
      'debug'             : false,
      'onclick'           : null,
      'timeOut'           : '5000',
      'showEasing'        : 'swing',
      'hideEasing'        : 'linear',
      'showMethod'        : 'fadeIn',
      'hideMethod'        : 'fadeOut',
      'closeButton'       : true,
      'newestOnTop'       : true,
      'progressBar'       : true,
      'showDuration'      : '300',
      'hideDuration'      : '1000',
      'positionClass'     : 'toast-top-right',
      'extendedTimeOut'   : '1000',
      'preventDuplicates' : false
    };
  }

  /**
   * register for notifications
   *
   * @private
   */
  _register () {
    // request notification permission
    Notification.requestPermission ().then ((result) => {
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
window.eden.alert = new edenAlert ();

/**
 * export alert class
 *
 * @type {alert}
 */
module.exports  = window.eden.alert;
