
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

    // load store
    this.i18n = require ('locale/public/js/store');

    // bind update
    this.i18n.on ('update', this.update);
  },

  /**
   * create translation function
   *
   * @param {String} string
   *
   * @return {String}
   */
  't' : function (str) {
    // check helper
    if (this.eden.get ('helpers') && this.eden.get ('helpers').i18n) {
      // return helper function
      return this.eden.get ('helpers').i18n.t (str);
    }

    // check if exists
    if (this.i18n) return this.i18n.t (str);
  },

  /**
   * change language function
   *
   * @param {String} lang
   */
  'lang' : function (lang) {
    // check if exists
    if (this.i18n) return this.i18n.lang (lang);
  }
});
