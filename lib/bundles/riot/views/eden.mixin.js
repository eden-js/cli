
riot.mixin ({
  'init' : function () {
    // set init
    this.__init = {};

    // set eden
    this.eden = {
      /**
       * emits to route
       *
       * @param {String} route
       */
      'go' : (route) => {
        // run on store
        if (!this.eden.frontend) return;

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
      },

      /**
       * sets eden store
       */
      'store' : require ('riot/public/js/store'),

      /**
       * sets frontend value
       */
      'frontend' : (typeof window !== 'undefined')
    };
  },

  /**
   * returns parent
   *
   * @private
   */
  '___root' : function () {
    // check parent
    if (this.__root) return this.__root;

    // get main parent
    let parent  = this;
    let nparent = this.parent;

    // loop for main parent
    while (nparent) {
      parent  = nparent;
      nparent = parent.parent;
    }

    // check parentnode
    if (parent.root && parent.root.parentNode && parent.root.parentNode._tag) {
      // set parent
      parent = parent.root.parentNode._tag;
    }

    // set root
    this.__root = parent;

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
    let value = (this.___root ().opts[key] || this.___root ().__init[key] || (typeof window !== 'undefined' ? window.eden[key] : false));

    // check store
    if (this.eden.store && this.eden.store.get (key)) value = this.eden.store.get (key);

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
    this.eden.store.set (key, value);

    // update view
    this.update ();
  }
});
