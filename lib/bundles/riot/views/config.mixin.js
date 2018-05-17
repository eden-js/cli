
// Create mixin
riot.mixin('config', {
  /**
   * On init function
   */
  'init' : function () {
    // Set value
    this.config = this.eden.get('config');

    // On mount update
    if (!this.eden.frontend) return;

    // On mount
    this.eden.store.on('config', this.__configEvent);

    // On unmount
    this.on('unmount', () => {
      // Off function
      this.eden.store.removeListener('config', this.__configEvent);
    });
  },

  /**
   * On config listener
   *
   * @private
   */
  '__configEvent' : function (config) {
    // Set page
    this.config = config;

    // Update view
    if (this.isMounted) this.update();
  }
});
