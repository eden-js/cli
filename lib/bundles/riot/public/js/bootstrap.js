/**
 * Created by Awesome on 2/6/2016.
 */

// use strict
'use strict';

// require local dependencies
var bar  = require ('nanobar');
var riot = require ('riot');
var tags = require ('app/cache/tags.min.js');

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
        this.run        = this.run.bind (this);
        this.initialize = this.initialize.bind (this);

        // bind private methods
        this._load     = this._load.bind (this);
        this._layout   = this._layout.bind (this);
        this._redirect = this._redirect.bind (this);

        // run on document ready
        jQuery (document).ready (() => {
            // initialize
            this.initialize ();
            // run with jquery
            this.run (jQuery);
        });
    }

    /**
     * initialize functionality
     */
    initialize () {
        // mount bar
        this._bar = new bar ();

        // mount riot tag
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
            // get a link
            var a = $ (this);

            // check if href
            if (a.attr ('href').indexOf ('//') > -1 || a.attr ('href').indexOf ('#') === 0) {
                return;
            }

            // prevent default
            e.preventDefault  ();
            e.stopPropagation ();

            // progress bar
            that._bar.go (50);

            // get json from a link
            that._load ('/ajx' + a.attr ('href'));
        });

        // on pop state
        window.onpopstate = (e) => {
            // set ops
            var ops = (e.state ? e.state.opts : that._state, true);

            // mount riot tags
            if (!that._layout (ops)) that._mount.setOpts (ops);
        };
    }

    /**
     * loads url
     *
     * @param  {String} url
     *
     * @private
     */
    _load (url) {
        // load json from url
        $.getJSON (url, (data, status, request) => {
            // check if redirect
            if (data.redirect) return this._redirect (data.redirect);

            // check for layout
            if (!this._layout (data.opts)) this._mount.setOpts (data.opts, true);

            // set progress go
            this._bar.go (100);

            // push state
            window.history.pushState (data, data.opts.route, data.opts.route);
        }).error ((e) => {
            console.log (e.getAllResponseHeaders());
        });
    }

    /**
     * checks for correct layout
     *
     * @param  {Object} opts
     *
     * @private
     * @return {Boolean}
     */
    _layout (opts) {
        // set that
        var that = this;

        // set layout variable
        var layout = (opts.layout || 'main-layout');

        // set remount
        var remount = false;

        // check layout tags
        jQuery ('body > *').each (function () {
            // check if not tag
            if (this.tagName.toUpperCase ().indexOf ('-LAYOUT') === -1) {
                // return not layout
                return;
            }

            // set tag
            var tag = jQuery (this);

            // check if correct layout
            if (this.tagName.toUpperCase () !== layout.toUpperCase ()) {
                // unmount tag
                that._mount.unmount (true);

                // replace tag
                tag.replaceWith ('<' + layout + '></' + layout + '>');

                // mount the tag
                that._mount = riot.mount (layout, opts)[0];

                // set remount
                remount = true;
            }
        });

        // return remount
        return remount;
    }

    /**
     * redirects to url
     *
     * @param  {String} url
     *
     * @private
     */
    _redirect (url) {
        // check if actual redirect
        if (/^(?:[a-z]+:)?\/\//i.test (url)) {
            // update window location
            window.location.href = url;

            // return
            return;
        }

        // load next redirect
        return this._load (url.indexOf ('/ajx') === 0 ? url : '/ajx' + url);
    }
}

/**
 * export new bootstrap function
 *
 * @return {bootstrap}
 */
module.exports = new bootstrap ();
