// create mixin
riot.mixin ('mount', {
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

    // set user
    this.mount = (parent['init:mount'] || parent.opts.mount || false);

    // check for window
    if (typeof window === 'undefined') return;

    // get riot store
    let riotStore = require ('riot/public/js/store');

    // set menus
    this.mount = riotStore.get ('mount') || this.mount;

    // add riotStore listeners
    riotStore.on ('mount', this._mount);

    // on mount
    this.on ('unmount', () => {
      // remove riotStore listeners
      riotStore.off ('mount', this._mount);
    });
  },

  /**
   * on riot mount event
   *
   * @param {Object} mount
   */
  '_mount' : function (page) {
    // set state
    this.mount = mount;

    // mount
    this.update ();
  }
});
