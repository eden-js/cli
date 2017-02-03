// create mixin
riot.mixin ('page', {
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
    this.page = parent['init:page'] || false;

    // check for window
    if (typeof window === 'undefined') return;

    // get riot store
    let riotStore = require ('riot/public/js/store');

    // set menus
    this.page = riotStore.get ('page') || this.page;

    // add riotStore listeners
    riotStore.on ('page', this._page);

    // on mount
    this.on ('unmount', () => {
      // remove riotStore listeners
      riotStore.off ('page', this._page);
    });
  },

  /**
   * on riot page event
   *
   * @param {Object} page
   */
  '_page' : function (page) {
    // set state
    this.page = page;

    // mount
    this.update ();
  }
});
