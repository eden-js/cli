
// Create mixin
riot.mixin('acl', {
  /**
   * On init function
   */
  'init' : function () {
    // Set value
    this.acl = require('user/public/js/acl');
  }
});
