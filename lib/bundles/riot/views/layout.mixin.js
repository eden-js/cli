// create mixin
riot.mixin ('layout', {
  /**
   * on init function
   */
  'init' : function () {
    // set private variables
    this.__page     = false;
    this.__pageName = false;

    // check page
    riotcontrol.on ('route', this._page);

    // on mount
    this.on ('mount', () => {
      // emit event
      this._route (this.opts);
    });
  },

  /**
   * private page
   *
   * @param {Object} opts
   * @private
   */
  '_route' : function (opts) {
    // set ops
    this.opts = opts;

    // check page name
    if (this.__pageName !== opts.mount.page) {
      // check page
      if (this.__page) this.__page[0].unmount (this.refs.page);

      // mount page
      this.__page = riot.mount (this.refs.page, opts.mount.page, opts);
    }

    // update view
    this.update ();
  }
});
