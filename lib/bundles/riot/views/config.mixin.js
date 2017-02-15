
// create mixin
riot.mixin ('config', {
  /**
   * on init function
   */
  'init' : function () {
    // set value
    this.config = this.eden.get ('config');

    // on mount update
    if (!this.eden.frontend) return;

    // on mount
    this.eden.store.on ('config', this.__configEvent);

    // on unmount
    this.on ('unmount', () => {
      // off function
      this.eden.store.off ('config', this.__configEvent);
    });
  },

  /**
   * on config listener
   *
   * @private
   */
  '__configEvent' : function (config) {
    // set page
    this.config = config;

    // update view
    if (this.isMounted) this.update ();
  }
});
