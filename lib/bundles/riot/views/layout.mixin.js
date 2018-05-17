
// Create mixin
riot.mixin('layout', {
  /**
   * On init function
   */
  'init' : function () {
    // Set private variables
    this.__page = false;
    this.__init = this.__init || {};

    // Set store
    this.__store = this.__store || require('default/public/js/store');

    // Clear if not frontend
    if (typeof window === 'undefined' && Object.keys(this.opts).length) this.__store.clear();

    // Check opts
    if (this.opts.state) {
      // Set init
      this.__init = this.opts;

      // Init store
      this.__store.init(this.__init);
    }

    // On mount
    this.on('mount', () => {
      // Run route
      this.__route(this.opts);
    });

    // Check for window
    if (!this.eden.frontend) return;

    // Add riotStore listeners
    this.eden.store.on('route', this.__route);

    // On mount
    this.on('unmount', () => {
      // Remove riotStore listeners
      this.eden.store.removeListener('route', this.__route);
    });
  },

  /**
   * On route function
   *
   * @param {Object} opts
   *
   * @returns {*}
   */
  '__route' : function (opts) {
    // Reset opts if includes state
    this.state = opts.state ? opts.state : this.state;

    // Check mount
    if (!opts.mount) return this.update();

    // Set page
    this.view = opts.mount.page;

    // Update view
    this.update();

    // Trigger mount
    if (this.refs.page) this.refs.page.trigger('mount');
  }
});
