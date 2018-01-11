
// create mixin
riot.mixin ('layout', {
  /**
   * on init function
   */
  'init' : function () {
    // set private variables
    this.__page = false;
    this.__init = this.__init || {};

    // set store
    this.__store = require ('riot/public/js/store');

    // clear if not frontend
    if (typeof window === 'undefined') this.__store.clear ();

    // check opts
    if (this.opts.state) {
      // set init
      this.__init = this.opts;

      // set values
      for (var key in this.__init) {
        // set store values
        this.__store[key] = this.__init[key];
      }
    }

    // on mount
    this.on ('mount', () => {
      // run route
      this.__route (this.opts);
    });

    // check for window
    if (!this.eden.frontend) return;

    // add riotStore listeners
    this.eden.store.on ('route', this.__route);

    // on mount
    this.on ('unmount', () => {
      // remove riotStore listeners
      this.eden.store.removeListener ('route', this.__route);
    });
  },

  /**
   * on route function
   *
   * @param {Object} opts
   * @private
   */
  '__route' : function (opts) {
    // reset opts if includes state
    this.state = opts.state ? opts.state : this.state;

    // check mount
    if (!opts.mount) return this.update ();

    // set page
    this.view = opts.mount.page;

    // update view
    this.update ();

    // trigger mount
    if (this.refs.page) this.refs.page.trigger ('mount');
  }
});
