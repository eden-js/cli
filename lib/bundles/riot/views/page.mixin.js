
// create mixin
riot.mixin ('page', {
  /**
   * on init function
   */
  'init' : function () {
    // set value
    this.page = this.eden.get ('page');

    // on mount update
    if (!this.eden.frontend) return;

    // on mount
    this.eden.store.on ('page', this.__pageEvent);

    // on unmount
    this.on ('unmount', () => {
      // off function
      this.eden.store.off ('page', this.__pageEvent);
    });
  },

  /**
   * on page listener
   *
   * @private
   */
  '__pageEvent' : function (page) {
    // set page
    this.page = page;

    // update view
    if (this.isMounted) this.update ();
  },

  /**
   * page set function
   *
   * @param  {String} key
   * @param  {*}      value
   */
  '__pageSet' : function (key, value) {
    // get original
    let page = this.eden.get ('page');

    // set key value
    page[key] = value;

    // set
    this.eden.set ('page', page);
  }
});
