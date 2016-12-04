/**
 * Created by Awesome on 2/6/2016.
 */

// use strict
'use strict';

// require local dependencies
var bar     = require ('nanobar');
var riot    = require ('riot');
var tags    = require ('app/cache/tags.min.js');
var history = require ('history').createBrowserHistory;

/**
 * build bootstrap class
 */
class router {
  /**
   * construct bootstrap class
   */
  constructor () {
    // set mount
    this._bar    = false;
    this._mount  = false;

    // create history
    this.history = history ();

    // bind methods
    this.go         = this.go.bind (this);
    this.load       = this.load.bind (this);
    this.submit     = this.submit.bind (this);
    this.initialize = this.initialize.bind (this);

    // bind private methods
    this._tags   = this._tags.bind (this);
    this._form   = this._form.bind (this);
    this._route  = this._route.bind (this);
    this._layout = this._layout.bind (this);

    // run on document ready
    jQuery (document).ready (() => {
      // push state
      this.history.replace ({
        'state'    : window.eden.state     || {},
        'pathname' : window.eden.state.url || ''
      });

      // initialize
      this.initialize ();
    });
  }

  /**
   * initialize functionality
   */
  initialize () {
    // set that
    var that = this;

    // mount bar
    this._bar = new bar ();

    // mount riot tag
    this._mount = riot.mount (document.querySelector ('body').children[0], window.eden.state)[0];

    // run on document ready
    jQuery (document).on ('click', 'a[href^="/"]', function (e) {
      // get a link
      var a = jQuery (this);

      // check link
      if (that._route (a.attr ('href'))) {
        // prevent default
        e.preventDefault  ();
        e.stopPropagation ();
      }
    });

    // run on form submit
    jQuery (document).on ('submit', 'form', function (e) {
      // get form element
      var form = jQuery (this);

      // check form
      if (that._form (form)) {
        // prevent default
        e.preventDefault  ();
        e.stopPropagation ();
      }
    });

    // on state change
    this.history.listen ((location, action) => {
      // check state
      if (location.state && location.state.layout && !this._layout (location.state)) {
        // set opts
        this._mount.setOpts (location.state, true);

        // update tags
        this._tags (location.state);
      }
    });
  }

  /**
   * loads url
   *
   * @param  {String} url
   */
  go (url) {
    // progress bar
    this._bar.go (50);

    // create location
    this.history.push ({
      'pathname' : url,
      'state'    : {}
    });

    // check if ajax
    if (url.indexOf ('/ajx') !== 0) {
      url = '/ajx' + url;
    }

    // load json from url
    jQuery.getJSON (url, (data, status, request) => {
      // load data
      this.load (data);
    });
  }

  /**
   * load data
   *
   * @param {Object} data
   */
  load (data) {
    // check if redirect
    if (data.redirect) return this._route (data.redirect);

    // set title
    document.title = (data.opts.pagetitle ? data.opts.pagetitle + ' | ' : '') + data.opts.title;

    // set progress go
    this._bar.go (100);

    // push state
    this.history.replace ({
      'state'    : data.opts,
      'pathname' : data.opts.url
    });
  }

  /**
   * submits form via ajax
   *
   * @param {HTMLElement} form
   */
  submit (form) {
    // progress bar
    this._bar.go (10);

    // get url
    var url = form.attr ('action') || window.location.href.split (window.eden.domain)[1];

    // create location
    this.history.push ({
      'state'    : {},
      'pathname' : url
    });

    // check if ajax
    if (url.indexOf ('/ajx') !== 0) {
      url = '/ajx' + url;
    }

    // submit form via ajax
    form.ajaxSubmit ({
      'url'            : url,
      'success'        : data => {
        // load data
        this.load (data);
      },
      'dataType'       : 'json',
      'uploadProgress' : (event, position, total, percent) => {
        // update bar position
        this._bar.go (percent);
      }
    });
  }

  /**
   * replace head tags from state
   *
   * @param {Object} state
   *
   * @private
   */
  _tags (state) {
    // set header information
    var found   = false;
    var newHead = jQuery (state.head);
    var nowHead = jQuery ('[data-eden="before-head"]').nextAll ('*');

    // loop all elements
    for (var a = 0; a < nowHead.length; a++) {
      // check now head
      found = false;

      // loop now head
      for (var b = 0; b < newHead.length; b++) {
        // check if found
        if (nowHead[a].outerHTML == newHead[b].outerHTML) {
          // set found
          found = true;
        }
      }

      // remove if not found
      if (!found) {
        nowHead[a].remove ();
      }
    }

    // set html
    var nowHTML = jQuery ('[data-eden="before-head"]').nextAll ('*');

    // loop all new elements
    for (var c = 0; c < newHead.length; c++) {
      // check now head
      found = false;

      // loop now head
      for (var d = 0; d < nowHead.length; d++) {
        // check if found
        if (newHead[c].outerHTML == nowHead[d].outerHTML) {
          // set found
          found = true;
        }
      }

      // remove if not found
      if (!found) {
        jQuery ('head').append (newHead[c]);
      }
    }
  }

  /**
   * submits form via ajax
   *
   * @param {HTMLElement} form
   *
   * @private
   * @return {Boolean}
   */
  _form (form) {
    // get form url
    var url = form.attr ('action') || window.location.href.split (window.eden.domain)[1];

    // check if actual redirect
    if (url.indexOf ('//') > -1 || url.indexOf ('#') === 0) {
      // return
      return false;
    }

    // submit form
    this.submit (form);

    // return true
    return true;
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
    this.go (url);

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
      if (this.tagName.toLowerCase ().indexOf ('-layout') === -1) {
        // return not layout
        return;
      }

      // set tag
      var tag = jQuery (this);

      // check if correct layout
      if (this.tagName.toLowerCase () !== layout.toLowerCase ()) {
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
 * create window router
 *
 * @type {router}
 */
window.eden.router = new router ();

/**
 * export new bootstrap function
 *
 * @return {bootstrap}
 */
module.exports = window.eden.router;
