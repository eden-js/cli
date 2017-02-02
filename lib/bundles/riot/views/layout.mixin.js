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
    this.__mount = this.opts.mount;

    // get riot store
    let riotStore = require ('riot/public/js/store');

    // check mount
    riotStore.on ('mount', (mount) => {
      // set mount
      this.__mount = mount;

      // mount
      this._mount ();
    });

    // check state
    riotStore.on ('state', (state) => {
      // set state
      this.opts = state;

      // mount
      this._mount (true);
    });

    // on mount
    this.on ('mount', () => {
      // emit event
      this._mount ();
    });
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
    if (this.__pageName !== this.__mount.page) {
      // check page
      if (this.__page) this.__page[0].unmount (this.refs.page);

      // mount page
      this.__page = riot.mount (this.refs.page, this.__mount.page, this.opts);

      // set update
      update = true;
    }

    // update view
    if (update) this.update ();
  }
});
