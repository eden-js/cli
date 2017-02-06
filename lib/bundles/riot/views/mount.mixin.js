
// create mixin
riot.mixin ('mount', {
  /**
   * on init function
   */
  'init' : function () {
    // set value
    this.mnt = this.eden.get ('mount');

    // on mount update
    if (!this.eden.store) return;

    // on mount
    this.eden.store.on ('mount', this.__mountEvent);

    // on unmount
    this.on ('unmount', () => {
      // off function
      this.eden.store.off ('mount', this.__mountEvent);
    });
  },

  /**
   * on page listener
   *
   * @private
   */
  '__mountEvent' : function (mount) {
    // set page
    this.mnt = mount;

    // update view
    if (this.isMounted) this.update ();
  }
});
