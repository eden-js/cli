<menu>
  <ul class="{ opts.classes && opts.classes.main ? opts.classes.main : 'nav' }" if={ this.menu.length }>
    <li each={ item, i in this.menu } class={ renderMainClass (item) }>
      <a class={ renderLinkClass (item) } href={ item.route } data-toggle={ hasChildren (item) ? 'dropdown' : false }>
        { item.title }
      </a>
    </li>
  </ul>

  <script>
    // set this menu
    this.menu = opts.menu && opts.menu[opts.name.toUpperCase ()] || [];

    /**
     * check if item has children
     *
     * @param {Object} item
     */
    hasChildren (item) {
      // loop menu
      for (var i = 0; i < this.menu.length; i++) {
        // check if has children
        if (this.menu[i].parent && this.menu[i].parent === item.route) {
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
      let rtnClass = [];

      // check for opts class
      rtnClass.push (opts.classes && opts.classes.item ? opts.classes.item : 'nav-item');
      rtnClass.push (this.hasChildren (item) ? 'dropdown' : '');
      rtnClass.push (item.route === opts.path ? 'active' : '');

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
      let rtnClass = [];

      // check for opts class
      rtnClass.push (opts.classes && opts.classes.link ? opts.classes.link : 'nav-link');
      rtnClass.push (item.route === opts.path ? 'active' : '');

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
      let rtnClass = [];

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
      let rtnClass = [];

      // check for opts class
      rtnClass.push (opts.classes && opts.classes.sub ? opts.classes.sub : 'dropdown-menu');

      // return joined class
      return rtnClass.join (' ');
    }

    /**
     * on update or mount event listener
     *
     * @param  {String} 'update mount'
     */
    this.on ('update', () => {
      // set subs
      this.menu = opts.menu && opts.menu[opts.name.toUpperCase ()] || [];
    });
  </script>
</menu>
