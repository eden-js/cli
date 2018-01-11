
// create mixin
riot.mixin ('menu', {
  /**
   * on init function
   */
  'init' : function () {
    // set value
    this.menu = this.eden.get ('menus');

    // on mount update
    if (!this.eden.store) return;

    // on mount
    this.eden.store.on ('menus', this.__menuEvent);

    // on unmount
    this.on ('unmount', () => {
      // off function
      this.eden.store.removeListener ('menus', this.__menuEvent);
    });
  },

  /**
   * on menu listener
   *
   * @private
   */
  '__menuEvent' : function (menu) {
    // set page
    this.menu = menu;

    // update view
    if (this.isMounted) this.update ();
  }
});
