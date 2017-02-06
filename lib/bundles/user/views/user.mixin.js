
// create mixin
riot.mixin ('user', {
  /**
   * on init function
   */
  'init' : function () {
    // check for window
    if (typeof window === 'undefined') return this.__set ('user');

    // set store
    this['store:user'] = require ('riot/public/js/store');

    // set mount
    this.__set ('user');

    // set listener
    this.__listen ('user');
  },

  /**
   * returns parent
   *
   * @private
   */
  '_rootScope' : function () {
    // check parent
    if (this.__parent) return this.__parent;

    // get main parent
    let parent  = this;
    let nparent = this.parent;

    // loop for main parent
    while (nparent) {
      parent  = nparent;
      nparent = parent.parent;
    }

    // set root parent
    this.__parent = parent;

    // return parent
    return parent;
  },

  /**
   * listen to events
   *
   * @param {String} param
   * @param {String} key
   */
  '__listen' : function (param, key) {
    // set param
    if (!key) key = param;

    // check for store
    if (!this['store:' + key]) return;

    // add riotStore listeners
    this['store:' + key].on ('mount', () => {
      // prevent update mount
      this.__set (param, key, true);
    });

    // on mount
    this.on ('unmount', () => {
      // remove riotStore listeners
      this['store:' + key].off ('mount', () => {
        // redo mount
        this.__set (param, key);
      });
    });
  },

  /**
   * sets key
   *
   * @param {String} param
   * @param {String} key
   * @param {String} prevent
   *
   * @return {*}
   * @private
   */
  '__set' : function (param, key, prevent) {
    // set param
    if (!key) key = param;

    // set key
    this[key] = (this._rootScope ()['init:' + param] || this._rootScope ().opts[param] || false);

    // check store
    if (this['store:' + key]) {
      this[key] = this['store:' + key].get (param);
    }

    // mount
    if (!prevent) this.update ();
  }
});
