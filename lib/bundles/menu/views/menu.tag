<menu>
  <ul class="{ opts.classes && opts.classes.main ? opts.classes.main : 'nav' }" if={ this.menu }>
    <li each={ item, i in getMenu(opts.name) } class={ renderMainClass(item) } if={ item.acl && item.acl.length ? this.acl.validate(item.acl) : true }>
      <a class={ renderLinkClass(item) } href={ item.route } data-toggle={ hasChildren(item) ? 'dropdown' : false }>
        <i if={ item.icon } class="{ item.icon }" />
        { this.t(item.title) }
      </a>
    </li>
  </ul>

  <script>
    // Add mixins
    this.mixin('acl');
    this.mixin('menu');
    this.mixin('i18n');
    this.mixin('mount');

    /**
     * Gets menu
     *
     * @param  {string} name
     *
     * @return {object[]}
     */
    getMenu (name) {
      // Get menu
      let menu = this.menu[name] || [];

      // Return menu
      return menu;
    }

    /**
     * Check if item has children
     *
     * @param {object} item
     */
    hasChildren (item) {
      // Loop menu
      for (let i = 0; i < this.menu[opts.name].length; i++) {
        // Check if has children
        if (this.menu[opts.name][i].parent && this.menu[opts.name][i].parent === item.route) {
          // Return true
          return true;
        }
      }

      // Return false
      return false;
    }

    /**
     * Renders main class
     *
     * @param  {object} item
     *
     * @return {string}
     */
    renderMainClass (item) {
      // Set class
      const rtnClass = [];

      // Check for opts class
      rtnClass.push(opts.classes && opts.classes.item ? opts.classes.item : 'nav-item');
      rtnClass.push(this.hasChildren(item) ? 'dropdown' : '');
      rtnClass.push(this.mnt.path.indexOf(item.route) === 0 && (item.route === this.mnt.path || item.route !== opts.base) && (item.route !== '/' || this.mnt.path === '/') ? 'active' : '');

      // Join class
      return rtnClass.join(' ').split('  ').join(' ');
    }

    /**
     * Renders link class
     *
     * @param  {object} item
     *
     * @return {string}
     */
    renderLinkClass (item) {
      // Set class
      const rtnClass = [];

      // Check for opts class
      rtnClass.push(opts.classes && opts.classes.link ? opts.classes.link : 'nav-link');
      rtnClass.push(this.mnt.path.indexOf(item.route) === 0 && (item.route === this.mnt.path || item.route !== opts.base) && (item.route !== '/' || this.mnt.path === '/') ? 'active' : '');

      // Return joined class
      return rtnClass.join(' ');
    }

    /**
     * Renders dropdown class
     *
     * @param  {object} item
     *
     * @return {string}
     */
    renderDropdownClass (item) {
      // Set class
      const rtnClass = [];

      // Check for opts class
      rtnClass.push(opts.classes && opts.classes.dropdown ? opts.classes.dropdown : 'dropdown-menu');

      // Return joined class
      return rtnClass.join(' ');
    }

    /**
     * Renders dropdown link class
     *
     * @param  {object} item
     *
     * @return {string}
     */
    renderDropdownLink (item) {
      // Set class
      const rtnClass = [];

      // Check for opts class
      rtnClass.push(opts.classes && opts.classes.sub ? opts.classes.sub : 'dropdown-menu');

      // Return joined class
      return rtnClass.join(' ');
    }
  </script>
</menu>
