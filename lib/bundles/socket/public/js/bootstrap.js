/**
 * Created by Awesome on 3/13/2016.
 */

// use strict
'use strict';

// require dependencies
var io = require ('socket.io-client');

/**
 * build socket class
 */
class socket {
    /**
     * construct socket class
     */
    constructor () {
        // bind methods
        this.on     = this.on.bind (this);
        this.off    = this.off.bind (this);
        this.build  = this.build.bind (this);
        this.alerts = this.alerts.bind (this);

        // bind private methods
        this._defaultToastr = this._defaultToastr.bind (this);

        // run
        this.build ();
    }

    /**
     * build chat class
     */
    build () {
        // set that
        var that = this;

        // run socket
        this.socket = io.connect ('//' + window.edenState.domain, {
            secure    : true,
            reconnect : true
        });

        // build alerts
        this.alerts ();
    }

    /**
     * builds default toastr alerts
     */
    alerts () {
        // set that
        var that = this;

        // on alert function
        this.socket.on('alert', alert => {
            // set default toastr options
            that._defaultToastr ();

            // check for toastr options
            if (alert.options) {
                for (var key in alert.options) {
                    window.toastr.options[key] = alert.options[key];
                }
            }

            // run toastr alert
            if (window.toastr[alert.type]) {
                window.toastr[alert.type](alert.message);
            }
        });
    }

    /**
     * run this on
     *
     * @param type
     * @param fn
     */
    on (type, fn) {
        this.socket.on (type, fn);
    }

    /**
     * off function
     *
     * @param type
     * @param fn
     */
    off (type, fn) {
        this.socket.off (type, fn);
    }

    /**
     * emits to socket
     *
     * @param  {String} type
     * @param  {*}      data
     */
    emit (type, data) {
        this.socket.emit (type, data);
    }

    /**
     * default toast options
     *
     * @private
     */
    _defaultToastr () {
        // set default options
        window.toastr.options = {
            "closeButton": true,
            "debug": false,
            "newestOnTop": true,
            "progressBar": true,
            "positionClass": "toast-top-full-width",
            "preventDuplicates": false,
            "onclick": null,
            "showDuration": "300",
            "hideDuration": "1000",
            "timeOut": "5000",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        };
    }
}

// build socket class
var builtSocket = new socket ();

/**
 * export socket class
 *
 * @type {socket}
 */
module.exports  = builtSocket;
