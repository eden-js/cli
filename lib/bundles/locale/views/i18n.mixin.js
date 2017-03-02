
// create mixin
riot.mixin ('i18n', {
  /**
   * on init function
   */
  'init' : function () {
    // set value
    this.i18n = this.eden.get ('i18n') || {};

    // on mount update
    if (!this.eden.frontend) return;
  },

  /**
   * create translation function
   *
   * @param {String} string
   *
   * @return {String}
   */
  'lang' : function (str) {
    // check if exists
    if (this.i18n[str]) return this.i18n[str];

    // return str
    return str;
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
  }
});
