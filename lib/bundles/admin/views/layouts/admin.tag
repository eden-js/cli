<admin-layout>
    <nav class="navbar navbar-full navbar-dark navbar-admin bg-inverse">
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
        <div class="row">
            <aside class="col-sm-3">
                <menu name="ADMIN" menu={ opts.menus } path={ opts.path } classes={ this.adminMenuClass } />
            </aside>
            <div class="col-sm-9">
                <alert error={ opts.error } success={ opts.success } />
                <div class="admin-page" name="page"></div>
            </div>
        </div>
    </div>

    <script>
        // add layout mixin
        this.mixin ('layout');

        // set menu class object
        this.menuClass = {
            'main' : 'nav navbar-nav float-xs-right'
        };
        this.adminMenuClass = {
            'main' : 'nav nav-pills nav-stacked',
            'item' : 'nav-item',
            'link' : 'nav-link'
        };

    </script>
</admin-layout>
