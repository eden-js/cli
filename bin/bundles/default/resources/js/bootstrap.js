/**
 * Created by Awesome on 2/6/2016.
 */

// use strict
'use strict';

// require local dependencies
var riot = require ('riot');
var tags = require ('cache/tags.min.js');

/**
 * build bootstrap class
 */
class bootstrap {
    /**
     * construct bootstrap class
     */
    constructor () {
        // set mount
        this._mount = false;

        // bind methods
        this.initialize = this.initialize.bind (this);
        this.run        = this.run.bind (this);

        // run methods
        this.initialize ();

        // run on document ready
        jQuery (document).ready (() => {
            this.run (jQuery);
        });
    }

    /**
     * initialize functionality
     */
    initialize () {
        // mount riot tags
        this._mount = riot.mount ('*', window.opts);
    }

    /**
     * run bootstrap class
     */
    run ($) {
        // set that
        var that = this;

        // run on document ready
        $ (document).on ('click', 'a[href^="/"]', function (e) {
            // prevent default
            e.preventDefault  ();
            e.stopPropagation ();

            // get a link
            var a = $ (this);

            // get json from a link
            $.getJSON ('/ajx' + a.attr ('href'), (data) => {
                // set window opts
                window.opts = data.opts;
                
                // mount riot tags
                this._mount = riot.mount ('*', window.opts);
            });
        });
    }
}

/**
 * export new bootstrap function
 *
 * @return {bootstrap}
 */
module.exports = new bootstrap ();
