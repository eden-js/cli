
// create mixin
riot.mixin ('user', {
  /**
   * on init function
   */
  'init' : function () {
    // set value
    this.user = this.eden.get ('user');

    // on mount update
    if (!this.eden.frontend) return;

    // get socket
    let socket = require ('socket/public/js/bootstrap');

    // on mount
    socket.on ('user', this.__userEvent);
    this.eden.store.on ('user', this.__userEvent);

    // on unmount
    this.on ('unmount', () => {
      // off function
      socket.off ('user', this.__userEvent);
      this.eden.store.off ('user', this.__userEvent);
    });
  },

  /**
   * on menu listener
   *
   * @private
   */
  '__userEvent' : function (user) {
    // set page
    this.user = user;

    // update view
    if (this.isMounted) this.update ();
  }
});
