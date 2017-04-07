
// require local dependencies
const bar         = require ('nanobar');
const riot        = require ('riot');
const history     = require ('history').createBrowserHistory;
const riotcontrol = require ('riotcontrol');

// get local dependencies
const store = require ('./store');

// require tags
require ('app/cache/tags.min');


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
    window.addEventListener ('load', () => {
      // push state
      this.history.replace ({
        'state' : {
          'page'  : this._store.get ('page'),
          'state' : this._store.get ('state'),
          'mount' : this._store.get ('mount')
        },
        'pathname' : this._store.get ('page').url
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
    this._mount = riot.mount (document.querySelector ('body').children[0], window.eden)[0];

    // listen to go
    this._store.on ('navigate', this.go);

    // run on document ready
    jQuery (document).on ('click', 'a[href^="/"]', function (e) {
      // check target
      if (this.getAttribute ('target').toLowerCase () === '_blank') return true;

      // check link
      if (that._route (this.getAttribute ('href'))) {
        // prevent default
        e.preventDefault  ();
        e.stopPropagation ();
      }
    });

    // run on form submit
    jQuery (document).on ('submit', 'form', function (e) {
      // check form
      if (that._form (this)) {
        // prevent default
        e.preventDefault  ();
        e.stopPropagation ();
      }
    });

    // on state change
    this.history.listen ((location) => {
      // scroll to top
      window.scrollTo (0, 0);

      // check state
      if (location.state && Object.keys (location.state).length > 0) {
        // set progress go
        this._bar.go (100);

        // set title
        document.title = (location.state.page.title ? location.state.page.title + ' | ' : '') + this._store.get ('config').title;

        // trigger
        for (var key in location.state) {
          // set data
          this._store.set (key, location.state[key]);
        }

        // check layout
        this._layout (location.state);

        // check tags
        this._tags (location.state.page);

        // do route
        // we do this as a seperate trigger to prevent double rendering
        // the riot layout (seperate mount and state events still fired)
        this._store.trigger ('route', {
          'mount' : location.state.mount,
          'state' : location.state.state
        });
      }
    });
  }

  /**
   * loads url
   *
   * @param  {String} url
   */
  async go (url) {
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
    let res = await fetch (url, {
      'credentials' : 'same-origin'
    });

    // load json
    this.load (await res.json ());
  }

  /**
   * load data
   *
   * @param {Object} data
   */
  load (data) {
    // check if redirect
    if (data.redirect) return this._route (data.redirect);

    // push state
    this.history.replace ({
      'state'    : data,
      'pathname' : data.mount.url
    });
  }

  /**
   * submits form via ajax
   *
   * @param {HTMLElement} form
   */
  async submit (form) {
    // get url
    let url = form.getAttribute ('action') || window.location.href.split (this._store.get ('config').domain)[1];

    // set request
    let opts = {
      'method'      : form.getAttribute ('method') || 'POST',
      'credentials' : 'same-origin'
    };

    // set body
    if (opts.method.toUpperCase () === 'POST') {
      // set to body
      opts.body = new FormData (form);
    } else {
      // add to url
      url += '?' + jQuery (form).serialize ();
    }

    // create location
    this.history.push ({
      'state'    : {},
      'pathname' : url
    });

    // check if ajax
    if (url.indexOf ('/ajx') !== 0) {
      url = '/ajx' + url;
    }

    // run fetch
    let res = await fetch (url, opts);

    // run json
    this.load (await res.json ());
  }

  /**
   * replace head tags from state
   *
   * @param {Object} state
   *
   * @private
   */
  _tags (page) {
    // check head
    if (!page.head) return;

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
        if (nowHead[a].outerHTML === newHead[b].outerHTML) {
          // set found
          found = true;
        }
      }

      // remove if not found
      if (!found) nowHead[a].remove ();
    }

    // loop all new elements
    for (var c = 0; c < newHead.length; c++) {
      // check now head
      found = false;

      // loop now head
      for (var d = 0; d < nowHead.length; d++) {
        // check if found
        if (newHead[c].outerHTML === nowHead[d].outerHTML) {
          // set found
          found = true;
        }
      }

      // remove if not found
      if (!found) jQuery ('head').append (newHead[c]);
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
    let url = form.getAttribute ('action') || window.location.href.split (this._store.get ('config').domain)[1];

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

    // check file
    if (url.split ('/').pop ().split ('.').length > 1) return false;

    // load next redirect
    this.go (url);

    // return true
    return true;
  }

  /**
   * checks for correct layout
   *
   * @param  {Object} state
   *
   * @private
   * @return {Boolean}
   */
  _layout (state) {
    // set layout variable
    let layout = (state.mount.layout || 'main-layout');

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
    this._mount = riot.mount (document.querySelector ('body').children[0], state)[0];

    // return true
    return true;
  }
}

/**
 * export new bootstrap function
 *
 * @return {bootstrap}
 */
exports = module.exports = window.eden.router = new router ();
