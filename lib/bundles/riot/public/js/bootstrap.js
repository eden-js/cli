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
        this.load       = this.load.bind (this);
        this.initialize = this.initialize.bind (this);

        // bind private methods
        this._layout   = this._layout.bind (this);
        this._redirect = this._redirect.bind (this);

        // run on document ready
        jQuery (document).ready (() => {
            // initialize
            this.initialize ();
            // run with jquery
            this.run (jQuery);
        });

        // run document route event
        jQuery (document).on ('route', (e, url) => {
            // initialize
            this.initialize ();

            // run with jquery
            this.load (url);
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

        // on window location Event
        $ (window).on ('location', (e, page) => {
            // check if href
            if (page.indexOf ('//') > -1 || page.indexOf ('#') === 0) {
                // redirect with js
                window.location.href = page;

                // return
                return;
            }

            // get json from a link
            that.load (page);
        });

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

            // get json from a link
            that.load (a.attr ('href'));
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
     */
    load (url) {
        // progress bar
        this._bar.go (50);

        // check if ajax
        if (url.indexOf ('/ajx') !== 0) {
            url = '/ajx' + url;
        }

        // load json from url
        $.getJSON (url, (data, status, request) => {
            // check if redirect
            if (data.redirect) return this._redirect (data.redirect);

            // check for layout
            if (!this._layout (data.opts)) this._mount.setOpts (data.opts, true);

            // set title
            document.title = (data.opts.pagetitle ? data.opts.pagetitle + ' | ' : '') + data.opts.title;

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
        return this.load (url);
    }
}

/**
 * export new bootstrap function
 *
 * @return {bootstrap}
 */
module.exports = new bootstrap ();
