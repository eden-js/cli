
// create mixin
riot.mixin ('alert', {
  /**
   * on init function
   */
  'init' : function () {
    // set value
    this.alert = {
      'alerts' : []
    };

    // on mount update
    if (!this.eden.frontend) return;

    // get socket
    this.alert = require ('alert/public/js/bootstrap');

    // on mount
    this.alert.on ('update', this.__alertEvent);
  },

  /**
   * on menu listener
   *
   * @private
   */
  '__alertEvent' : function () {
    // update view
    if (this.isMounted) this.update ();
  }
});
