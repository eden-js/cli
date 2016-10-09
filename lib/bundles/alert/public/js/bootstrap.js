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
        // bind methods
        this.alert = this.alert.bind (this);

        // bind private methods
        this._reset = this._reset.bind (this);

        // run alert on socket Event
        socket.on ('alert', alert => {
            // run alert
            this.alert (alert.type, alert.message, alert.opts);
        });
    }

    /**
     * alert user
     *
     * @param {String} type
     * @param {String} message
     * @param {Object} opts
     */
    alert (type, message, opts) {
        // reset toastr options
        this._reset ();

        // check opts
        if (opts) {
            // loop options
            for (var key in opts) {
                // set options
                window.toastr[key] = opts[key];
            }
        }

        // run alert
        if (window.toastr[type]) window.toastr[type] (message);
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
