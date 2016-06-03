<menu>
    <ul class="{ opts.classes && opts.classes.main ? opts.classes.main : 'nav' }" if={ this.menu.length }>
        <li each={ item, i in this.menu } class="{ opts.classes && opts.classes.item ? opts.classes.item : 'nav-item' }{ item.children && item.children.length ? 'dropdown' : '' }{ item.active ? ' active' : '' }">
            <a class="{ opts.classes && opts.classes.link ? opts.classes.link : 'nav-link' }" href={ item.children && item.children.length ? '#!' : item.route } data-toggle={ item.children && item.children.length ? 'dropdown' : false }>
                { item.title }
            </a>
            <div if={ item.children && item.children.length } class="{ opts.classes && opts.classes.dropdown ? opts.classes.dropdown : 'dropdown-menu' }">
                <a each={ sub, a in item.children } class="{ opts.classes && opts.classes.sub ? opts.classes.sub : 'dropdown-menu' }" href={ sub.route }>
                    { sub.title }
                </a>
            </div>
        </li>
    </ul>

    <script>
        // set this menu
        this.menu = [];

        /**
         * on update or mount event listener
         *
         * @param  {String} 'update mount'
         */
        this.on ('update mount', () => {
            console.log (opts.menu);
            // set subs
            this.menu = opts.menu[opts.name.toUpperCase ()] || [];
        });
    </script>
</menu>
