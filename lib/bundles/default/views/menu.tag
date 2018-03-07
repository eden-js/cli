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
        // set this menu
        this.menu = [];

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
            rtnClass.push (item.children && item.children.length ? 'dropdown' : '');
            rtnClass.push (item.active ? 'active' : '');

            // join class
            return rtnClass.join (' ').replace ('  ', ' ').replace ('  ', ' ');
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
            rtnClass.push (item.active ? 'active' : '');

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

        /**
         * on update or mount event listener
         *
         * @param  {String} 'update mount'
         */
        this.on ('update mount', () => {
            // set subs
            this.menu = opts.menu && opts.menu[opts.name.toUpperCase ()] || [];
        });
    </script>
</menu>
