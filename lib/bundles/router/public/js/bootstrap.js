
// Require local dependencies
const bar     = require('nanobar');
const store   = require('default/public/js/store');
const socket  = require('socket/public/js/bootstrap');
const history = require('history').createBrowserHistory;


/**
 * Build router class
 */
class router {

  /**
   * Construct router class
   */
  constructor () {
    // Set mount
    this._bar   = false;
    this._store = store;

    // Set store values
    for (let key in window.eden) {
      // Set to store
      this._store.set(key, window.eden[key]);
    }

    // Create history
    this.history = history();

    // Bind methods
    this.go     = this.go.bind(this);
    this.load   = this.load.bind(this);
    this.build  = this.build.bind(this);
    this.submit = this.submit.bind(this);
    this.update = this.update.bind(this);

    // Bind private methods
    this._tags  = this._tags.bind(this);
    this._form  = this._form.bind(this);
    this._route = this._route.bind(this);

    // On state
    socket.on('state', this.update);

    // Run on document ready
    window.addEventListener('load', () => {
      // Get qs
      let qs = (this.history.location.pathname || '').split('?');

      // Push state
      this.history.replace({
        'state' : {
          'page'  : this._store.get('page'),
          'state' : this._store.get('state'),
          'mount' : this._store.get('mount')
        },
        'pathname' : this._store.get('mount').url + (qs[1] ? '?' + qs[1] : '')
      });

      // Initialize
      this.building = this.build();
    });
  }

  /**
   * Initialize functionality
   */
  async build () {
    // Set that
    let that = this;

    // Mount bar
    this._bar = new bar();

    // Await mount
    await this._store.hook('initialize', window.eden, (state) => {
      // Mount
      this._store.emit('initialize', state);
    });

    // Listen to go
    this._store.on('navigate', this.go);

    // Run on document ready
    jQuery(document).on('click', 'a[href^="/"]', function (e) {
      // Check
      if (this.getAttribute('data-eden') === 'disable') return;

      // Check target
      if (this.getAttribute('target') && this.getAttribute('target').toLowerCase() === '_blank') return;

      // Check link
      if (that._route(this.getAttribute('href'))) {
        // Prevent default
        e.preventDefault();
        e.stopPropagation();
      }
    });

    // Run on form submit
    jQuery(document).on('submit', 'form', function (e) {
      // Check
      if (this.getAttribute('data-eden') === 'disable') return;

      // Check form
      if (that._form(this)) {
        // Prevent default
        e.preventDefault();
        e.stopPropagation();
      }
    });

    // On state change
    this.history.listen(async (location) => {
      // Check state
      if (location.state && Object.keys(location.state).length > 0) {
        // Scroll to top
        if (!location.state.prevent) window.scrollTo(0, 0);

        // Set progress go
        this._bar.go(100);

        // Check prevent
        if (location.state.prevent) return;

        // Set title
        if (this._store.get('config').direction === 0) {
          document.title = (location.state.page.title ? location.state.page.title + ' | ' : '');
        } else if (this._store.get('config').direction === 1) {
          document.title = this._store.get('config').title + (location.state.page.title ? ' | ' + location.state.page.title : '');
        } else {
          document.title = (location.state.page.title ? location.state.page.title + ' | ' : '') + this._store.get('config').title;
        }

        // Trigger
        for (let key in location.state) {
          // Set data
          this._store.set(key, location.state[key]);
        }

        // Do layout
        await this._store.hook('layout', location.state, (state) => {
          // Emit events
          this._store.emit('layout', state);
        });

        // Check tags
        this._tags(location.state.page);

        // Do route
        // we do this as a seperate trigger to prevent double rendering
        await this._store.hook('route', {
          'mount' : location.state.mount,
          'state' : location.state.state
        }, (data) => {
          // Emit events
          this._store.emit('route', data);
        });
      }
    });
  }

  /**
   * Loads url
   *
   * @param  {String} url
   *
   * @returns {*}
   */
  async go (url) {
    // Progress bar
    this._bar.go(50);

    // Check route
    if (url.includes('//') || url.indexOf('#') === 0) {
      // Timeout bar go
      setTimeout(() => {
        // Complete bar after 1 second
        this._bar.go(100);
      }, 1000);

      // Return url
      return window.location = url;
    }

    // Create location
    this.history.push({
      'state'    : {},
      'pathname' : url
    });

    // Run try/catch
    try {
      // Load json from url
      let res = await fetch(url, {
        'mode'    : 'no-cors',
        'headers' : {
          'Accept' : 'application/json'
        },
        'redirect'    : 'follow',
        'credentials' : 'same-origin'
      });

      // Load json
      this.load(await res.json());
    } catch (e) {
      // Log error
      setTimeout(() => {
        // Complete bar after 1 second
        this._bar.go(100);
      }, 1000);

      // Redirect
      window.location = url;
    }
  }

  /**
   * Load data
   *
   * @param {Object} data
   */
  async load (data) {
    // Await hook
    await this._store.hook('load', data, (data) => {
      // Do event
      this._store.emit('load', data);
    });

    // Push state
    this.history.replace({
      'state'    : data,
      'pathname' : data.mount.url
    });
  }

  /**
   * Submits form via ajax
   *
   * @param {HTMLElement} form
   */
  async submit (form) {
    // Get url
    let url = form.getAttribute('action') || window.location.href.split(this._store.get('config').domain)[1];

    // Set request
    let opts = {
      'method'  : form.getAttribute('method') || 'POST',
      'headers' : {
        'Accept' : 'application/json'
      },
      'redirect'    : 'follow',
      'credentials' : 'same-origin'
    };

    // Set body
    if (opts.method.toUpperCase() === 'POST') {
      // Set to body
      opts.body = new FormData(form);
    } else {
      // Add to url
      url += '?' + jQuery(form).serialize();
    }

    // Hook form
    await this._store.hook('submit', {
      'url'  : url,
      'opts' : opts
    }, ({ url, opts }) => {
      // Do trigger
      this._store.emit('submit', url, opts);
    });

    // Create location
    this.history.push({
      'state'    : {},
      'pathname' : url
    });

    // Run fetch
    let res = await fetch(url, opts);

    // Run json
    this.load(await res.json());
  }

  /**
   * Updates page state
   *
   * @param  {Object} state
   */
  async update (state) {
    // Let old
    let old = {
      'state' : {
        'page'  : this._store.get('page'),
        'state' : this._store.get('state'),
        'mount' : this._store.get('mount')
      },
      'pathname' : this._store.get('mount').url
    };

    // Check pathname
    if (old.pathname === state.url) {
      // Check url
      if (state.opts.mount && state.opts.mount.url) old.pathname = state.opts.mount.url;

      // Replace state object
      ['page', 'state', 'mount'].forEach((type) => {
        // Skip type
        if (!state.opts[type]) return;

        // Set in store
        for (let key in state.opts[type]) {
          // Update state
          old.state[type][key] = state.opts[type][key];
        }

        // Set state
        this._store.set('type', old.state[type]);
      });

      // Hook form
      await this._store.hook('state', old, (old) => {
        // Trigger state
        this._store.emit('state', old);
      });

      // Push state
      this.history.replace(old);
    }
  }

  /**
   * Replace head tags from state
   *
   * @param {Object} page
   *
   * @private
   */
  _tags (page) {
    // Check head
    if (!page.head) return;

    // Set header information
    let found   = false;
    let newHead = jQuery(page.head);
    let nowHead = jQuery('[data-eden="head-start"]').nextAll('*');

    // Loop all elements
    for (let i = 0; i < nowHead.length; i++) {
      // Check now head
      found = false;

      // Check break
      if (nowHead[i].getAttribute('data-eden') === 'head-end') break;

      // Loop now head
      for (let x = 0; x < newHead.length; x++) {
        // Check if found
        if (nowHead[i].outerHTML === newHead[x].outerHTML) {
          // Set found
          found = true;
        }
      }

      // Remove if not found
      if (!found) jQuery(nowHead[i]).remove();
    }

    // Loop all new elements
    for (let i = 0; i < newHead.length; i++) {
      // Check now head
      found = false;

      // Loop now head
      for (let x = 0; x < nowHead.length; x++) {
        // Check if found
        if (newHead[i].outerHTML === nowHead[x].outerHTML) {
          // Set found
          found = true;
        }
      }

      // Remove if not found
      if (!found) jQuery('[data-eden="head-end"]').before(newHead[i]);
    }
  }

  /**
   * Submits form via ajax
   *
   * @param {HTMLElement} form
   *
   * @private
   * @return {Boolean}
   */
  _form (form) {
    // Get form url
    let url = form.getAttribute('action') || window.location.href.split(this._store.get('config').domain)[1];

    // Check if actual redirect
    if (url.includes('//') || url.indexOf('#') === 0) {
      // Return
      return false;
    }

    // Submit form
    this.submit(form);

    // Return true
    return true;
  }

  /**
   * Redirects to url
   *
   * @param  {String} url
   *
   * @private
   * @return {Boolean}
   */
  _route (url) {
    // Check if actual redirect
    if (url.includes('//') || url.indexOf('#') === 0) return false;

    // Check file
    if (url.split('/').pop().split('.').length > 1) return false;

    // Load next redirect
    this.go(url);

    // Return true
    return true;
  }
}

/**
 * Export new router function
 *
 * @return {router}
 */
exports = module.exports = window.eden.router = new router();
