
// create mixin
riot.mixin ('user', {
  /**
   * on init function
   */
  'init' : function () {
    // set value
    this.user = this.eden.get ('user') || {};

    // set acl
    this.user.acl = require ('user/public/js/acl');
    // add get method
    this.user.get = (key) => {
      // return id
      return this.user[key];
    };
    // add set method
    this.user.set = (key, value) => {
      // return id
      this.user[key] = value;
    };
    // add normal functions
    this.user.exists = () => {
      // return id
      return !!this.user.id;
    };

    // on mount update
    if (!this.eden.frontend) return;

    // get socket
    this.user = require ('user/public/js/bootstrap');

    // on update
    this.user.on ('update', this.update);

    // on unmount
    this.on ('unmount', () => {
      // remove on update
      this.user.removeListener ('update', this.update);
    });
  }
});
