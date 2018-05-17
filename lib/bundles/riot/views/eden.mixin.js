
riot.mixin({
  'init' : function () {
    // Check opts
    if (this.opts.opts) {
      // Loop object keys
      Object.keys(this.opts.opts).forEach((key) => {
        // Set key
        this.opts[key] = this.opts.opts[key];
      });

      // Delete opts
      delete this.opts.opts;
    }

    // Set init
    this.__init = {};

    // Set eden
    this.eden = {
      /**
       * Emits to route
       *
       * @param {String} route
       */
      'go' : (route) => {
        // Run on store
        if (!this.eden.frontend) return;

        // Emit go
        this.eden.store.emit('navigate', route);
      },

      /**
       * Get function
       *
       * @param {String} key
       *
       * @returns {*}
       */
      'get' : (key) => {
        // Return private method
        return this.___get(key);
      },

      /**
       * Setter function
       *
       * @param {String} key
       * @param {*} value
       *
       * @returns {*}
       */
      'set' : (key, value) => {
        // Return private method
        return this.___set(key, value);
      },

      /**
       * Gets root layout
       *
       * @returns {*}
       */
      'root' : () => {
        // Return private method
        return this.___root();
      },

      /**
       * Sets eden store
       */
      'store' : require('default/public/js/store'),

      /**
       * Sets frontend/backend value
       */
      'backend'  : (typeof window === 'undefined'),
      'frontend' : (typeof window !== 'undefined')
    };

    // On mount or update
    this.on('update', () => {
      // Check opts
      if (this.opts.opts) {
        // Loop object keys
        Object.keys(this.opts.opts).forEach((key) => {
          // Set key
          this.opts[key] = this.opts.opts[key];
        });

        // Delete opts
        delete this.opts.opts;
      }
    });
  },

  /**
   * Returns parent
   *
   * @private
   */
  '___root' : function () {
    // Check parent
    if (this.__root) return this.__root;

    // Get main parent
    let parent  = this;
    let nparent = this.parent;

    // Loop for main parent
    while (nparent) {
      parent  = nparent;
      nparent = parent.parent;
    }

    // Check parentnode
    if (parent.root && parent.root.parentNode && parent.root.parentNode._tag) {
      // Set parent
      parent = parent.root.parentNode._tag;
    }

    // Set root
    this.__root = parent;

    // Return parent
    return parent;
  },

  /**
   * Gets key
   *
   * @param {Strin} key
   */
  '___get' : function (key) {
    // Get value
    let value = (this.___root().opts[key] || this.___root().__init[key] || (typeof window !== 'undefined' ? window.eden[key] : false));

    // Check store
    if (this.eden.store && this.eden.store.get(key)) value = this.eden.store.get(key);

    // Return value
    return value;
  },

  /**
   * Sets page
   *
   * @param {String} param
   * @param {String} key
   * @param {String} prevent
   *
   * @return {*}
   * @private
   */
  '___set' : function (key, value) {
    // Set value
    this.eden.store.set(key, value);

    // Update view
    this.update();
  }
});
