/**
 * Created by Awesome on 2/6/2016.
 */

// use strict
'use strict';

// require local dependencies
var bar     = require ('nanobar');
var riot    = require ('riot');
var tags    = require ('app/cache/tags.min.js');
var history = require ('history');

/**
 * build bootstrap class
 */
class bootstrap {
    /**
     * construct bootstrap class
     */
    constructor () {
        // set mount
        this._bar     = false;
        this._mount   = false;
        this._history = history.createHistory ();

        // bind methods
        this.run        = this.run.bind (this);
        this.load       = this.load.bind (this);
        this.initialize = this.initialize.bind (this);

        // bind private methods
        this._route  = this._route.bind (this);
        this._layout = this._layout.bind (this);

        // run on document ready
        jQuery (document).ready (() => {
            // set initial location
            var location   = this._history.getCurrentLocation ();

            // set location state
            location.state = window.edenState || {};

            // replace location in window
            this._history.replace (location);

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

        // on window route Event
        $ (window).on ('route', (e, page) => {
            // load page
            this._route (page);
        });

        // run on document ready
        $ (document).on ('click', 'a[href^="/"]', function (e) {
            // get a link
            var a = $ (this);

            // check link
            if (that._route (a.attr ('href'))) {
                // prevent default
                e.preventDefault  ();
                e.stopPropagation ();
            }
        });

        // on state change
        this._history.listen (location => {
            // check state
            if (location.state && location.state.layout && !this._layout (location.state)) {
                // set opts
                this._mount.setOpts (location.state, true);
            }
        });
    }

    /**
     * loads url
     *
     * @param  {String} url
     */
    load (url) {
        // progress bar
        this._bar.go (50);

        // create location
        this._history.push ({
            'pathname' : url,
            'state'    : {}
        });

        // check if ajax
        if (url.indexOf ('/ajx') !== 0) {
            url = '/ajx' + url;
        }

        // load json from url
        $.getJSON (url, (data, status, request) => {
            // check if redirect
            if (data.redirect) return this._route (data.redirect);

            // set title
            document.title = (data.opts.pagetitle ? data.opts.pagetitle + ' | ' : '') + data.opts.title;

            // set progress go
            this._bar.go (100);

            // push state
            this._history.replace ({
                'pathname' : data.opts.route,
                'state'    : data.opts
            });
        }).error ((e) => {
            console.log (e.getAllResponseHeaders());
        });
    }

    /**
     * redirects to url
     *
     * @param  {String} url
     *
     * @private
     * @return {Boolean}
     */
    _route (url) {
        // check if actual redirect
        if (url.indexOf ('//') > -1 || url.indexOf ('#') === 0) {
            // update window location
            window.location.href = url;

            // return
            return false;
        }

        // load next redirect
        this.load (url);

        // return true
        return true;
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
}

/**
 * export new bootstrap function
 *
 * @return {bootstrap}
 */
module.exports = new bootstrap ();
