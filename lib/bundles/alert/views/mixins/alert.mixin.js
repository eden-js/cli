
// create mixin
riot.mixin ('alert', {
  /**
   * on init function
   */
  'init' : function () {
    // set value
    this.alert = {
      'alerts' : (this.eden.get ('alerts') || []).map ((data) => {
        // set opts
        let opts = typeof data.opts === 'string' ? {
          'text' : opts
        } : data.opts;

        // set opts
        opts.type  = data.type === 'error' ? 'danger' : data.type;

        // set other options
        opts.visible  = true;
        opts.position = opts.position || 'top-right';

        // return opts
        return opts;
      })
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
