
// require local dependencies
const bar     = require ('nanobar');
const store   = require ('default/public/js/store');
const socket  = require ('socket/public/js/bootstrap');
const history = require ('history').createBrowserHistory;


/**
 * build router class
 */
class router {

  /**
   * construct router class
   */
  constructor () {
    // set mount
    this._bar   = false;
    this._store = store;

    // set store values
    for (var key in window.eden) {
      // set to store
      this._store.set (key, window.eden[key]);
    }

    // create history
    this.history = history ();

    // bind methods
    this.go     = this.go.bind (this);
    this.load   = this.load.bind (this);
    this.build  = this.build.bind (this);
    this.submit = this.submit.bind (this);
    this.update = this.update.bind (this);

    // bind private methods
    this._tags  = this._tags.bind (this);
    this._form  = this._form.bind (this);
    this._route = this._route.bind (this);

    // on state
    socket.on ('state', this.update);

    // run on document ready
    window.addEventListener ('load', () => {
      // get qs
      let qs = (this.history.location.pathname || '').split ('?');

      // push state
      this.history.replace ({
        'state' : {
          'page'  : this._store.get ('page'),
          'state' : this._store.get ('state'),
          'mount' : this._store.get ('mount')
        },
        'pathname' : this._store.get ('mount').url + (qs[1] ? '?' + qs[1] : '')
      });

      // initialize
      this.building = this.build ();
    });
  }

  /**
   * initialize functionality
   */
  async build () {
    // set that
    let that = this;

    // mount bar
    this._bar = new bar ();

    // await mount
    await this._store.hook ('initialize', window.eden, (state) => {
      // mount
      this._store.emit ('initialize', state);
    });

    // listen to go
    this._store.on ('navigate', this.go);

    // run on document ready
    jQuery (document).on ('click', 'a[href^="/"]', function (e) {
      // check
      if (this.getAttribute ('data-eden') === 'disable') return;

      // check target
      if (this.getAttribute ('target') && this.getAttribute ('target').toLowerCase () === '_blank') return;

      // check link
      if (that._route (this.getAttribute ('href'))) {
        // prevent default
        e.preventDefault  ();
        e.stopPropagation ();
      }
    });

    // run on form submit
    jQuery (document).on ('submit', 'form', function (e) {
      // check
      if (this.getAttribute ('data-eden') === 'disable') return;

      // check form
      if (that._form (this)) {
        // prevent default
        e.preventDefault  ();
        e.stopPropagation ();
      }
    });

    // on state change
    this.history.listen (async (location) => {
      // check state
      if (location.state && Object.keys (location.state).length > 0) {
        // scroll to top
        if (!location.state.prevent) window.scrollTo (0, 0);

        // set progress go
        this._bar.go (100);

        // check prevent
        if (location.state.prevent) return;

        // set title
        document.title = (location.state.page.title ? location.state.page.title + ' | ' : '') + this._store.get ('config').title;

        // trigger
        for (var key in location.state) {
          // set data
          this._store.set (key, location.state[key]);
        }

        // do layout
        await this._store.hook ('layout', location.state, (state) => {
          // emit events
          this._store.emit ('layout', state);
        });

        // check tags
        this._tags (location.state.page);

        // do route
        // we do this as a seperate trigger to prevent double rendering
        await this._store.hook ('route', {
          'mount' : location.state.mount,
          'state' : location.state.state
        }, (data) => {
          // emit events
          this._store.emit ('route', data);
        });
      }
    });
  }

  /**
   * loads url
   *
   * @param  {String} url
   *
   * @returns {*}
   */
  async go (url) {
    // progress bar
    this._bar.go (50);

    // check route
    if (url.indexOf ('//') > -1 || url.indexOf ('#') === 0) {
      // timeout bar go
      setTimeout (() => {
        // complete bar after 1 second
        this._bar.go (100);
      }, 1000);

      // return url
      return window.location = url;
    }

    // create location
    this.history.push ({
      'state'    : {},
      'pathname' : url
    });

    // run try/catch
    try {
      // load json from url
      let res = await fetch (url, {
        'mode'    : 'no-cors',
        'headers' : {
          'Accept' : 'application/json'
        },
        'redirect'    : 'follow',
        'credentials' : 'same-origin'
      });

      // load json
      this.load (await res.json ());
    } catch (e) {
      // log error
      setTimeout (() => {
        // complete bar after 1 second
        this._bar.go (100);
      }, 1000);

      // redirect
      window.location = url;
    }
  }

  /**
   * load data
   *
   * @param {Object} data
   */
  async load (data) {
    // await hook
    await this._store.hook ('load', data, (data) => {
      // do event
      this._store.emit ('load', data);
    });

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
      'method'  : form.getAttribute ('method') || 'POST',
      'headers' : {
        'Accept' : 'application/json'
      },
      'redirect'    : 'follow',
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

    // hook form
    await this._store.hook ('submit', { url, opts }, ({ url, opts }) => {
      // do trigger
      this._store.emit ('submit', url, opts);
    });

    // create location
    this.history.push ({
      'state'    : {},
      'pathname' : url
    });

    // run fetch
    let res = await fetch (url, opts);

    // run json
    this.load (await res.json ());
  }

  /**
   * updates page state
   *
   * @param  {Object} state
   */
  async update (state) {
    // let old
    let old = {
      'state' : {
        'page'  : this._store.get ('page'),
        'state' : this._store.get ('state'),
        'mount' : this._store.get ('mount')
      },
      'pathname' : this._store.get ('mount').url
    };

    // check pathname
    if (old.pathname === state.url) {
      // check url
      if (state.opts.mount && state.opts.mount.url) old.pathname = state.opts.mount.url;

      // replace state object
      ['page', 'state', 'mount'].forEach ((type) => {
        // skip type
        if (!state.opts[type]) return;

        // set in store
        for (var key in state.opts[type]) {
          // update state
          old.state[type][key] = state.opts[type][key];
        }

        // set state
        this._store.set ('type', old.state[type]);
      });

      // hook form
      await this._store.hook ('state', old, (old) => {
        // trigger state
        this._store.emit ('state', old);
      });

      // push state
      this.history.replace (old);
    }
  }

  /**
   * replace head tags from state
   *
   * @param {Object} page
   *
   * @private
   */
  _tags (page) {
    // check head
    if (!page.head) return;

    // set header information
    let found   = false;
    let newHead = jQuery (page.head);
    let nowHead = jQuery ('[data-eden="head-start"]').nextAll ('*');

    // loop all elements
    for (let i = 0; i < nowHead.length; i++) {
      // check now head
      found = false;

      // check break
      if (nowHead[i].getAttribute ('data-eden') === 'head-end') break;

      // loop now head
      for (let x = 0; x < newHead.length; x++) {
        // check if found
        if (nowHead[i].outerHTML === newHead[x].outerHTML) {
          // set found
          found = true;
        }
      }

      // remove if not found
      if (!found) jQuery (nowHead[i]).remove ();
    }

    // loop all new elements
    for (let i = 0; i < newHead.length; i++) {
      // check now head
      found = false;

      // loop now head
      for (let x = 0; x < nowHead.length; x++) {
        // check if found
        if (newHead[i].outerHTML === nowHead[x].outerHTML) {
          // set found
          found = true;
        }
      }

      // remove if not found
      if (!found) jQuery ('[data-eden="head-end"]').before (newHead[i]);
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
}

/**
 * export new router function
 *
 * @return {router}
 */
exports = module.exports = window.eden.router = new router ();
