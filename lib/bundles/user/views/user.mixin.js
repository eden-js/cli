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
    this.user = parent['init:user'] || false;

    // check window
    if (typeof window === 'undefined') return;

    // set riot store
    this._store = require ('user/public/js/store');

    // add riotStore listeners
    this._store.on ('user', this._user);

    // on mount
    this.on ('unmount', () => {
      // remove riotStore listeners
      this._store.off ('user', this._user);
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