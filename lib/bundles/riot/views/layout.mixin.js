// create mixin
riot.mixin ('layout', {
  init: function () {
    // set page
    this.mountedPage = false;

    // on updated
    this.on ('update', () => {
      // get page
      let page = this.refs.page;

      // unmount
      if (this.mountedPage) this.mountedPage[0].unmount (page);

      // mount page on load
      if (this.opts.mountPage && page) this.mountedPage = riot.mount (page, this.opts.mountPage, this.opts);

      // check for jQuery
      if (typeof jQuery !== 'undefined') {
        jQuery ('body').trigger ('page');
      }
    });

    // on updated
    this.on ('mount', () => {
      // get page
      let page = this.refs.page;

      // mount page on load
      if (this.opts.mountPage && page) this.mountedPage = riot.mount (page, this.opts.mountPage, this.opts);

      // check for jQuery
      if (typeof jQuery !== 'undefined') {
        jQuery ('body').trigger ('page');
      }
    });
  },

  getOpts: function () {
    // return ops
    return this.opts;
  },

  setOpts: function (opts, update) {
    // set ops
    this.opts = opts;

    // update view
    if (update) this.update ();

    // return tag instance
    return this;
  }
});
