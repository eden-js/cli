
// create mixin
riot.mixin ('acl', {
  /**
   * on init function
   */
  'init' : function () {
    // set value
    this.acl = require ('user/public/js/acl');
  }
});
