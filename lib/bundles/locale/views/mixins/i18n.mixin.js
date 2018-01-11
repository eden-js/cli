
// create mixin
riot.mixin ('i18n', {
  /**
   * on init function
   */
  'init' : function () {
    // set value
    this.i18n = this.eden.get ('i18n') || {};

    // set default functions
    this.i18n.lang = () => this.eden.get ('i18n').lng;

    // on mount update
    if (!this.eden.frontend) return;

    // load store
    this.i18n = require ('locale/public/js/store');

    // bind update
    this.i18n.on ('update', this.update);

    // on unmount
    this.on ('unmount', () => {
      // remove bind update
      this.i18n.removeListener (this.update);
    });
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

    // check i18n
    if (this.i18n && this.i18n.defaults && !this.i18n.initialized) {
      // check default
      if (this.i18n.defaults[JSON.stringify (arguments)]) return this.i18n.defaults[JSON.stringify (arguments)];
    }

    // check if exists
    if (this.i18n) return this.i18n.t (...arguments);
  },

  /**
   * change language function
   *
   * @param {String} lang
   */
  'lang' : function () {
    // check if exists
    if (this.i18n) return this.i18n.lang (...arguments);
  }
});
