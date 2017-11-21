<menu>
  <ul class="{ opts.classes && opts.classes.main ? opts.classes.main : 'nav' }" if={ this.menu }>
    <li each={ item, i in getMenu (opts.name) } class={ renderMainClass (item) }>
      <a class={ renderLinkClass (item) } href={ item.route } data-toggle={ hasChildren (item) ? 'dropdown' : false }>
        <i if={ item.icon } class="{ item.icon }" />
        { this.t (item.title) }
      </a>
    </li>
  </ul>

  <script>
    // add menu mixin
    this.mixin ('menu');
    this.mixin ('i18n');
    this.mixin ('mount');

    /**
     * gets menu
     *
     * @param  {String} name
     *
     * @return {Array}
     */
    getMenu (name) {
      // get menu
      let menu = this.menu[name] || [];

      // return menu
      return menu;
    }

    /**
     * check if item has children
     *
     * @param {Object} item
     */
    hasChildren (item) {
      // loop menu
      for (var i = 0; i < this.menu[opts.name].length; i++) {
        // check if has children
        if (this.menu[opts.name][i].parent && this.menu[opts.name][i].parent === item.route) {
          return true;
        }
      }

      // return false
      return false;
    }

    /**
     * renders main class
     *
     * @param  {Object} item
     *
     * @return {String}
     */
    renderMainClass (item) {
      // set class
      var rtnClass = [];

      // check for opts class
      rtnClass.push (opts.classes && opts.classes.item ? opts.classes.item : 'nav-item');
      rtnClass.push (this.hasChildren (item) ? 'dropdown' : '');
      rtnClass.push (this.mnt.path.indexOf (item.route) === 0 && (item.route === this.mnt.path || item.route !== opts.base) ? 'active' : '');

      // join class
      return rtnClass.join (' ').split ('  ').join (' ');
    }

    /**
     * renders link class
     *
     * @param  {Object} item
     *
     * @return {String}
     */
    renderLinkClass (item) {
      // set class
      var rtnClass = [];

      // check for opts class
      rtnClass.push (opts.classes && opts.classes.link ? opts.classes.link : 'nav-link');
      rtnClass.push (this.mnt.path.indexOf (item.route) === 0 && (item.route === this.mnt.path || item.route !== opts.base) ? 'active' : '');

      // return joined class
      return rtnClass.join (' ');
    }

    /**
     * renders dropdown class
     *
     * @param  {Object} item
     *
     * @return {String}
     */
    renderDropdownClass (item) {
      // set class
      var rtnClass = [];

      // check for opts class
      rtnClass.push (opts.classes && opts.classes.dropdown ? opts.classes.dropdown : 'dropdown-menu');

      // return joined class
      return rtnClass.join (' ');
    }

    /**
     * renders dropdown link class
     *
     * @param  {Object} item
     *
     * @return {String}
     */
    renderDropdownLink (item) {
      // set class
      var rtnClass = [];

      // check for opts class
      rtnClass.push (opts.classes && opts.classes.sub ? opts.classes.sub : 'dropdown-menu');

      // return joined class
      return rtnClass.join (' ');
    }
  </script>
</menu>
