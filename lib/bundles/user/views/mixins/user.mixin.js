
// Create mixin
riot.mixin('user', {
  /**
   * On init function
   */
  'init' : function () {
    // Set value
    this.user = this.eden.get('user') || {};

    // On mount update
    if (!this.eden.frontend) {
      // Set acl
      this.user.acl = require('user/public/js/acl');

      // Add get method
      this.user.get = (key) => {
        // Check key
        if (!key) return this.user;

        // Return id
        return this.user[key];
      };

      // Add set method
      this.user.set = (key, value) => {
        // Return id
        this.user[key] = value;
      };

      // Add normal functions
      this.user.exists = () => {
        // Return id
        return !!this.user.id;
      };
    } else {
      // Check user loaded
      this.user = Object.keys(this.user).length && this.user.on ? this.user : require('user/public/js/bootstrap');

      // On update
      this.user.on('update', this.update);

      // On unmount
      this.on('unmount', () => {
        // Remove on update
        this.user.removeListener('update', this.update);
      });
    }
  }
});
