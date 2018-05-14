<menu>
  <ul class="{ opts.classes && opts.classes.main ? opts.classes.main : 'nav' }" if={ this.menu.length }>
    <li each={ item, i in this.menu } class={ renderMainClass (item) }>
      <a class={ renderLinkClass (item) } href={ item.children && item.children.length ? '#!' : item.route } data-toggle={ item.children && item.children.length ? 'dropdown' : false }>
        { item.title }
      </a>

      <div if={ item.children && item.children.length } class={ renderDropdownClass (item) }>
        <a each={ sub, a in item.children } class={ renderDropdownLink (item) } href={ sub.route }>
          { sub.title }
        </a>
      </div>
    </li>
  </ul>

  <script>
    // Set this menu
    this.menu = [];

    /**
     * Renders main class
     *
     * @param  {Object} item
     *
     * @return {String}
     */
    renderMainClass (item) {
      // Set class
      const rtnClass = [];

      // Check for opts class
      rtnClass.push (opts.classes && opts.classes.item ? opts.classes.item : 'nav-item');
      rtnClass.push (item.children && item.children.length ? 'dropdown' : '');
      rtnClass.push (item.active ? 'active' : '');

      // Join class
      return rtnClass.join (' ').replace ('  ', ' ').replace ('  ', ' ');
    }

    /**
     * Renders link class
     *
     * @param  {Object} item
     *
     * @return {String}
     */
    renderLinkClass (item) {
      // Set class
      const rtnClass = [];

      // Check for opts class
      rtnClass.push (opts.classes && opts.classes.link ? opts.classes.link : 'nav-link');
      rtnClass.push (item.active ? 'active' : '');

      // Return joined class
      return rtnClass.join (' ');
    }

    /**
     * Renders dropdown class
     *
     * @param  {Object} item
     *
     * @return {String}
     */
    renderDropdownClass (item) {
      // Set class
      const rtnClass = [];

      // Check for opts class
      rtnClass.push (opts.classes && opts.classes.dropdown ? opts.classes.dropdown : 'dropdown-menu');

      // Return joined class
      return rtnClass.join (' ');
    }

    /**
     * Renders dropdown link class
     *
     * @param  {Object} item
     *
     * @return {String}
     */
    renderDropdownLink (item) {
      // Set class
      const rtnClass = [];

      // Check for opts class
      rtnClass.push (opts.classes && opts.classes.sub ? opts.classes.sub : 'dropdown-menu');

      // Return joined class
      return rtnClass.join (' ');
    }

    /**
     * On update or mount event listener
     *
     * @param  {String} 'update mount'
     */
    this.on ('update mount', () => {
      // Set subs
      this.menu = opts.menu && opts.menu[opts.name.toUpperCase ()] || [];
    });
  </script>
</menu>
