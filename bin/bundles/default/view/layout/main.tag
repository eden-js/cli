<main-layout>
    <nav class="navbar navbar-fixed-top navbar-dark bg-inverse">
        <a class="navbar-brand" href="#">
            { opts.title }
        </a>
        <menu name="MAIN" menu={ opts.menu } classes={ menuClass } />
    </nav>
    <alert success={ opts.success } error={ opts.error } />
    <div class="container" name="page"></div>

    <script>
        // add layout mixin
        this.mixin ('layout');

        // set menu class object
        this.menuClass = {
            'main' : 'nav navbar-nav'
        };
    </script>
</main-layout>
