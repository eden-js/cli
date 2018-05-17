
// Create mixin
riot.mixin('mount', {
  /**
   * On init function
   */
  'init' : function () {
    // Set value
    this.mnt = this.eden.get('mount') || {};

    // On mount update
    if (!this.eden.frontend) return;

    // On mount
    this.eden.store.on('mount', this.__mountEvent);

    // On unmount
    this.on('unmount', () => {
      // Off function
      this.eden.store.removeListener('mount', this.__mountEvent);
    });
  },

  /**
   * On page listener
   *
   * @private
   */
  '__mountEvent' : function (mount) {
    // Set page
    this.mnt = mount;

    // Update view
    if (this.isMounted) this.update();
  }
});
