
// Create mixin
riot.mixin('i18n', {

  /**
   * On init function
   */
  'init' : function () {
    // Set value
    this.i18n = this.eden.get('i18n') || {};

    // On mount update
    if (!this.eden.frontend) {
      // Set default functions
      this.i18n.lang = () => {
        return this.eden.get('i18n').lng; 
      };
    } else {
      // Load store
      this.i18n = this.eden.get('i18n') || require('locale/public/js/bootstrap');

      // Bind update
      this.i18n.on('update', this.update);

      // On unmount
      this.on('unmount', () => {
        // Remove bind update
        this.i18n.removeListener('update', this.update);
      });
    }
  },

  /**
   * Create translation function
   *
   * @param {String} str
   *
   * @return {String}
   */
  't' : function (str) {
    // Check helper
    if (this.eden.get('helpers') && this.eden.get('helpers').i18n) {
      // Return helper function
      return this.eden.get('helpers').i18n.t(str);
    }

    // Check i18n
    if (this.i18n && this.i18n.defaults && !this.i18n.initialized) {
      // Check default
      if (this.i18n.defaults[JSON.stringify(arguments)]) return this.i18n.defaults[JSON.stringify(arguments)];
    }

    // Check if exists
    if (this.i18n) return this.i18n.t(...arguments);
  },

  /**
   * Change language function
   *
   * @return {String}
   */
  'lang' : function () {
    // Check if exists
    if (this.i18n) return this.i18n.lang(...arguments);
  }
});
