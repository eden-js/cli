<admin-layout>
    <div class="container">
        <nav class="navbar navbar-dark navbar-admin bg-inverse">
            <a class="navbar-brand" href="#">
                { opts.title }
            </a>
            <menu name="MAIN" menu={ opts.menu } classes={ this.menuClass } />
        </nav>
        <div class="row">
            <div class="col-sm-3">
                <div class="card">
                    <menu name="ADMIN" menu={ opts.menu } classes={ this.adminMenuClass } />
                </div>
            </div>
            <div class="col-sm-9">
                <div class="admin-page" name="page"></div>
            </div>
        </div>
    </div>

    <script>
        // add layout mixin
        this.mixin ('layout');

        // set menu class object
        this.menuClass = {
            'main' : 'nav navbar-nav navbar-right'
        };
        this.adminMenuClass = {
            'main' : 'list-group list-group-flush',
            'item' : 'list-group-item'
        };

    </script>
</admin-layout>
