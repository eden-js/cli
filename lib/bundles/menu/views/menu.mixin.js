
// create mixin
riot.mixin ('menu', {
  /**
   * on init function
   */
  'init' : function () {
    // get main parent
    let parent  = this;
    let nparent = this.parent;

    // loop for main parent
    while (nparent) {
      parent  = nparent;
      nparent = parent.parent;
    }

    // set menus
    this.menu = (parent['init:menus'] || parent.opts.menus || false);

    // check if window
    if (typeof window === 'undefined') return;

    // get riot store
    let riotStore = require ('riot/public/js/store');

    // set menus
    this.menu = riotStore.get ('menus') || this.menu;

    // add riotStore listeners
    riotStore.on ('menus', this._menus);

    // on mount
    this.on ('unmount', () => {
      // remove riotStore listeners
      riotStore.off ('menus', this._menus);
    });
  },

  /**
   * on riot state event
   *
   * @param {Object} menus
   */
  '_menus' : function (menus) {
    // set state
    this.menu = menus;

    // mount
    this.update ();
  }
});
