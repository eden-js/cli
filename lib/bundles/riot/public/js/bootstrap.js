/**
 * Created by Awesome on 2/6/2016.
 */

// use strict
'use strict';

// require local dependencies
const bar         = require ('nanobar');
const riot        = require ('riot');
const history     = require ('history').createBrowserHistory;
const riotcontrol = require ('riotcontrol');

// get local dependencies
const tags  = require ('app/cache/tags.min.js');
const store = require ('./store');


/**
 * build bootstrap class
 */
class router {
  /**
   * construct bootstrap class
   */
  constructor () {
    // set mount
    this._bar   = false;
    this._mount = false;
    this._store = store;

    // add store to riotcontrol
    riotcontrol.addStore (this._store);

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
    let that = this;

    // mount bar
    this._bar = new bar ();

    // mount riot tag
    this._mount = riot.mount (document.querySelector ('body').children[0], window.eden.state)[0];

    // run on document ready
    jQuery (document).on ('click', 'a[href^="/"]', function (e) {
      // check link
      if (that._route (jQuery (this).attr ('href'))) {
        // prevent default
        e.preventDefault  ();
        e.stopPropagation ();
      }
    });

    // run on form submit
    jQuery (document).on ('submit', 'form', function (e) {
      // check form
      if (that._form (jQuery (this))) {
        // prevent default
        e.preventDefault  ();
        e.stopPropagation ();
      }
    });

    // on state change
    this.history.listen ((location, action) => {
      // check state
      if (location.state.mount && location.state.mount.layout && !this._layout (location.state)) {
        // emit to riotcontrol
        riotcontrol.trigger ('route', location.state);

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
      'state'    : {},
      'pathname' : url
    });

    // check if ajax
    if (url.indexOf ('/ajx') !== 0) {
      url = '/ajx' + url;
    }

    // load json from url
    jQuery.getJSON (url, (data, status, request) => {
      // load data
      this.load (data);
    }).fail (data => {
      // load failure
      this.load (data.responseJSON);
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

    // set window state
    window.eden.state = data.opts;
  }

  /**
   * submits form via ajax
   *
   * @param {HTMLElement} form
   */
  submit (form) {
    // get url
    let url = form.attr ('action') || window.location.href.split (window.eden.domain)[1];

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
      'error'          : data => {
        // load
        this.load (data.responseJSON);
      },
      'success'        : this.load,
      'dataType'       : 'json',
      'uploadProgress' : (event, position, total, percent) => {
        // update bar position
        this._bar.go (percent < 90 ? percent : 90);
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
    let found   = false;
    let newHead = jQuery (state.head);
    let nowHead = jQuery ('[data-eden="before-head"]').nextAll ('*');

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
    let nowHTML = jQuery ('[data-eden="before-head"]').nextAll ('*');

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
    let url = form.attr ('action') || window.location.href.split (window.eden.domain)[1];

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
    if (url.indexOf ('//') > -1 || url.indexOf ('#') === 0) return false;

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
    let that = this;

    // set layout variable
    let layout = (opts.mount.layout || 'main-layout');

    // set remount
    let remount = false;

    // check layout tags
    jQuery ('body > *').each (function () {
      // check if not tag
      if (this.tagName.toLowerCase ().indexOf ('-layout') === -1) {
        // return not layout
        return;
      }

      // set tag
      let tag = jQuery (this);

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
