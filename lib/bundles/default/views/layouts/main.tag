<main-layout>
    <nav class="navbar navbar-full navbar-light bg-faded">
        <div class="container">
            <button class="navbar-toggler hidden-sm-up" type="button" data-toggle="collapse" data-target="#navbar-header" aria-controls="navbar-header">
              ☰
            </button>
            <div class="collapse navbar-toggleable-xs" id="navbar-header">
                <a class="navbar-brand" href="/">
                    { opts.title }
                </a>
                <menu name="MAIN" menu={ opts.menus } path={ opts.path } classes={ menuClass } />
            </div>
        </div>
    </nav>
    <div class="container">
        <alert success={ opts.success } error={ opts.error } />
    </div>
    <div ref="page"></div>

    <script>
        // add layout mixin
        this.mixin ('layout');

        // set menu class object
        this.menuClass = {
            'main' : 'nav navbar-nav float-xs-right'
        };
    </script>
</main-layout>
