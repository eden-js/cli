<example-layout>
    <div class="container">
        <nav class="navbar navbar-light bg-faded">
            <button class="navbar-toggler hidden-sm-up" type="button" data-toggle="collapse" data-target="#navbar-header" aria-controls="navbar-header">
              ☰
            </button>
            <div class="collapse navbar-toggleable-xs" id="navbar-header">
                <a class="navbar-brand" href="/">
                    { opts.title }
                </a>
                <menu name="MAIN" menu={ opts.menu } classes={ menuClass } />
            </div>
        </nav>
        <alert success={ opts.success } error={ opts.error } />
        <div name="page"></div>
    </div>

    <script>
        // add layout mixin
        this.mixin ('layout');

        // set menu class object
        this.menuClass = {
            'main' : 'nav navbar-nav'
        };
    </script>
</example-layout>
