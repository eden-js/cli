// Create alert mixin
riot.mixin ('alert', {
  /**
   * On init function
   */
  'init' : function () {
    // Set alert object
    this.alert = {
      'alerts' : (this.eden.get ('alerts') || []).map ((data) => {
        // Set opts
        const opts = typeof data.opts === 'string' ? {
          'text' : opts
        } : data.opts;

        // Set opts
        opts.type  = data.type === 'error' ? 'danger' : data.type;

        // Set other options
        opts.visible  = true;
        opts.position = opts.position || 'top-right';

        // Return opts
        return opts;
      })
    };

    // Check frontend
    if (!this.eden.frontend) return;

    // Get alert
    this.alert = require ('alert/public/js/bootstrap');

    // On update
    this.alert.on ('update', this.__alertEvent);
  },

  /**
   * On alert event
   *
   * @private
   */
  '__alertEvent' : function () {
    // Update view
    if (this.isMounted) this.update ();
  }
});
