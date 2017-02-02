// create mixin
riot.mixin ('layout', {
  /**
   * on init function
   */
  'init' : function () {
    // set private variables
    this.__page     = false;
    this.__pageName = false;

    // set private variables
    this.__mount = this.opts.mount || false;

    // reset opts if includes state
    this.opts = this.opts.state || this.opts;

    // get riot store
    let riotStore = require ('riot/public/js/store');

    // add riotStore listeners
    riotStore.on ('mount', this._layoutMount);
    riotStore.on ('state', this._layoutState);

    // on mount
    this.on ('mount', () => {
      // emit event
      this._mount ();
    });

    // on mount
    this.on ('unmount', () => {
      // remove riotStore listeners
      riotStore.off ('mount', this._layoutMount);
      riotStore.off ('state', this._layoutState);
    });
  },

  /**
   * on riot mount event
   *
   * @param {Object} mount
   */
  '_layoutMount' : function (mount) {
    // set mount
    this.__mount = mount;
  },

  /**
   * on riot state event
   *
   * @param {Object} state
   */
  '_layoutState' : function (state) {
    // set state
    this.opts = state;

    // mount
    this._mount (true);
  },

  /**
   * private page
   *
   * @param {Boolean} update
   *
   * @private
   */
  '_mount' : function (update) {
    // check page name
    if (this.__pageName !== this.__mount.page && this.refs.page) {
      // check page
      if (this.__page) this.__page[0].unmount (this.refs.page);

      // mount page
      this.__page = riot.mount (this.refs.page, this.__mount.page, this.opts);
    }

    // update view
    if (update && this.refs.page) this.update ();
  }
});
