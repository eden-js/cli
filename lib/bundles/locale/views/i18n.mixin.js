
// create mixin
riot.mixin ('i18n', {
  /**
   * on init function
   */
  'init' : function () {
    // set value
    this.__lang = this.eden.get ('i18n') || {};

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
  'i18n' : function (str) {
    // check if exists
    if (this.__lang[str]) return this.__lang[str];

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
