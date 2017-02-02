// create mixin
riot.mixin ('user', {
  /**
   * on init function
   */
  'init' : function () {
    // set user
    this.user = this.opts.user || false;
    
    // check window
    if (typeof window === 'undefined') return;

    // set riot store
    this._store = require ('user/public/js/store');

    /**
     * on mount function
     *
     * @param {String} mount
     */
    this.on ('mount', () => {
      // emit
      this._store.trigger ('user:init');

      // on user
      this._store.on ('user', (user) => {
        // set user
        this.user = user;

        // update view
        this.update ();
      });
    });
  }
});
