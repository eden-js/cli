
riot.mixin ({
  'init' : function () {
    // set eden
    this.eden = {
      /**
       * emits to route
       *
       * @param {String} route
       */
      'go' : (route) => {
        // run on store
        if (!this.eden.store) return;

        // emit go
        this.eden.store.trigger ('navigate', route);
      },

      /**
       * get function
       *
       * @param {String} key
       */
      'get' : (key) => {
        // return private method
        return this.___get (key);
      },

      /**
       * setter function
       *
       * @param {String} key
       * @param {*} value
       */
      'set' : (key, value) => {
        // return private method
        return this.___set (key, value);
      },

      /**
       * gets root layout
       */
      'root' : () => {
        // return private method
        return this.___root ();
      }
    };

    // set store
    if (typeof window !== 'undefined') this.eden.store = require ('riot/public/js/store');
  },

  /**
   * returns parent
   *
   * @private
   */
  '___root' : function () {
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
   * gets key
   *
   * @param {Strin} key
   */
  '___get' : function (key) {
    // get value
    let value = (this.___root ()['init:' + key] || this.___root ().opts[key] || false);

    // check store
    if (this.eden.store) value = this.eden.store.get (key);

    // return value
    return value;
  },

  /**
   * sets page
   *
   * @param {String} param
   * @param {String} key
   * @param {String} prevent
   *
   * @return {*}
   * @private
   */
  '___set' : function (key, value) {
    // set value
    this._store.set (key, value);

    // update view
    this.update ();
  }
});
