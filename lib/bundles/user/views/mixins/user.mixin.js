
// create mixin
riot.mixin ('user', {
  /**
   * on init function
   */
  'init' : function () {
    // set value
    this.user = this.eden.get ('user') || {};

    // on mount update
    if (!this.eden.frontend) {
      // set acl
      this.user.acl = require ('user/public/js/acl');

      // add get method
      this.user.get = (key) => {
        // check key
        if (!key) return this.user;

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
    } else {
      // check user loaded
      this.user = require ('user/public/js/bootstrap');

      // on update
      this.user.on ('update', this.update);

      // on unmount
      this.on ('unmount', () => {
        // remove on update
        this.user.removeListener ('update', this.update);
      });
    }
  }
});
