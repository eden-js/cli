// create mixin
riot.mixin ('layout', {
  /**
   * on init function
   */
  'init' : function () {
    // set private variables
    this.__page = false;
    this.__init = this.__init || {};

    // check opts
    if (this.opts.state) {
      // set init
      this.__init = this.opts;
    }

    // on mount
    this.on ('mount', () => {
      // mount with opts
      this.__route (this.opts);
    });

    // check for window
    if (!this.eden.store) return;

    // add riotStore listeners
    this.eden.store.on ('route', this.__route);

    // on mount
    this.on ('unmount', () => {
      // remove riotStore listeners
      this.eden.store.off ('route', this.__route);
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
    this.opts = opts.state ? opts.state : this.opts;

    // check mount
    if (!opts.mount) return this.update ();

    // unmount page
    if (this.__page) this.__page.unmount (true);

    // mount page
    this.__page = riot.mount (this.refs.page, opts.mount.page, this.opts)[0];
  }
});
