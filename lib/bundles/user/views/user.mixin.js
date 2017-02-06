
// create mixin
riot.mixin ('user', {
  /**
   * on init function
   */
  'init' : function () {
    // set value
    this.user = this.eden.get ('user');

    // on mount update
    if (!this.eden.store) return;

    // on mount
    this.eden.store.on ('user', this.__userEvent);

    // on unmount
    this.on ('unmount', () => {
      // off function
      this.eden.store.off ('user', this.__userEvent);
    });
  },

  /**
   * on menu listener
   *
   * @private
   */
  '__userEvent' : function (user) {
    // set page
    this.user = user;

    // update view
    if (this.isMounted) this.update ();
  }
});
