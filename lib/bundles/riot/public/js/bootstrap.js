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

    // set store values
    for (var key in window.eden) {
      // set to store
      this._store.set (key, window.eden[key]);
    }

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
        'state'    : {
          'state' : this._store.get ('state'),
          'mount' : this._store.get ('mount')
        },
        'pathname' : this._store.get ('url')
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
    this._mount = riot.mount (document.querySelector ('body').children[0], {
      'state' : this._store.get ('state'),
      'mount' : this._store.get ('mount')
    })[0];

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
      if (location.state && Object.keys (location.state).length === 2 && Object.keys (location.state.mount).length > 1) {
        // check layout
        this._layout (location.state.state, location.state.mount);
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
    document.title = (data.page.title ? data.page.title + ' | ' : '') + this._store.get ('config').title;

    // set progress go
    this._bar.go (100);

    // trigger state
    for (var key in data) {
      // trigger
      this._store.set (key, data[key]);
    }

    // update tags
    if (data.page) this._tags (data.page);

    // push state
    this.history.replace ({
      'state'    : {
        'state' : data.state || false,
        'mount' : data.mount || false
      },
      'pathname' : data.mount.url
    });
  }

  /**
   * submits form via ajax
   *
   * @param {HTMLElement} form
   */
  submit (form) {
    // get url
    let url = form.attr ('action') || window.location.href.split (this._store.get ('config').domain)[1];

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
  _tags (page) {
    // set header information
    let found   = false;
    let newHead = jQuery (page.head);
    let nowHead = jQuery ('[data-eden="head"]').nextAll ('*');

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
    let nowHTML = jQuery ('[data-eden="head"]').nextAll ('*');

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
    let url = form.attr ('action') || window.location.href.split (this._store.get ('config').domain)[1];

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
  _layout (opts, mount) {
    // set layout variable
    let layout = (mount.layout || 'main-layout');

    // get current layout
    let current = document.querySelector ('body').children[0];

    // check if layout needs replacing
    if (current.tagName.toLowerCase () === layout.toLowerCase ()) {
      return false;
    }

    // unmount tag
    this._mount.unmount (true);

    // replace with
    current.replaceWith (document.createElement (layout));

    // mount new tag
    this._mount = riot.mount (document.querySelector ('body').children[0], {
      'state' : this._store.get ('state'),
      'mount' : this._store.get ('mount')
    })[0];

    // return true
    return true;
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
