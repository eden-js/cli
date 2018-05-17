// Create alert mixin
riot.mixin('alert', {
  /**
   * On init function
   */
  'init' : function () {
    // Set alert object
    this.alert = {
      'alerts' : []
    };

    // Check frontend
    if (!this.eden.frontend) return;

    // Get alert
    this.alert = require('alert/public/js/bootstrap');

    // On update
    this.alert.on('update', this.__alertEvent);
  },

  /**
   * On alert event
   *
   * @private
   */
  '__alertEvent' : function () {
    // Update view
    if (this.isMounted) this.update();
  }
});
