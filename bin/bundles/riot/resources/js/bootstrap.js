/**
 * Created by Awesome on 2/6/2016.
 */

// use strict
'use strict';

// require local dependencies
var bar  = require ('nanobar');
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
        this._bar   = false;
        this._mount = false;
        this._state = window.edenState;

        // bind methods
        this.initialize = this.initialize.bind (this);
        this.run        = this.run.bind (this);

        // run on document ready
        jQuery (document).ready (() => {
            this.initialize ();
            this.run (jQuery);
        });
    }

    /**
     * initialize functionality
     */
    initialize () {
        // mount riot tags
        this._bar   = new bar ();
        this._mount = riot.mount (document.querySelector ('body').children[0], window.edenState)[0];
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

            // progress bar
            that._bar.go (50);

            // get a link
            var a = $ (this);

            // get json from a link
            $.getJSON ('/ajx' + a.attr ('href'), (data) => {
                // mount riot tags
                that._mount.setOpts (data.opts, true);

                // set progress go
                that._bar.go (100);
                
                // push state
                window.history.pushState (data, data.opts.route, data.opts.route);
            });
        });
        
        // on pop state
        window.onpopstate = function (e) {
            // mount riot tags
            that._mount.setOpts (e.state ? e.state.opts : that._state, true);
        };
    }
}

/**
 * export new bootstrap function
 *
 * @return {bootstrap}
 */
module.exports = new bootstrap ();
