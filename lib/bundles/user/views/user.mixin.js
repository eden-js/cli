// create mixin
riot.mixin ('user', {
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
    this.user = (parent['init:user'] || parent.opts.user || false);

    // check window
    if (typeof window === 'undefined') return;

    // get riot store
    let riotStore = require ('riot/public/js/store');

    // set menus
    this.user = riotStore.get ('user') || this.user;

    // add riotStore listeners
    riotStore.on ('user', this._user);

    // on mount
    this.on ('unmount', () => {
      // remove riotStore listeners
      riotStore.off ('user', this._user);
    });
  },

  /**
   * on user event
   *
   * @param {Object} user
   */
  '_user' : function (user) {
    // set user
    this.user = user;

    // update view
    this.update ();
  }
});
