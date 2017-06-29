<admin-layout>
  <nav class="navbar navbar-toggleable-md navbar-dark bg-inverse mb-3">
    <div class="container">
      <button class="navbar-toggler hidden-sm-up" type="button" data-toggle="collapse" data-target="#navbar-admin" aria-controls="navbar-admin">
        ☰
      </button>
      <div class="collapse navbar-collapse" id="navbar-admin">
        <a class="navbar-brand" href="/">
          { this.config.title }
        </a>
        <menu name="MAIN" class="ml-auto" menu={ opts.menus } path={ opts.path } classes={ menuClass } />
      </div>
    </div>
  </nav>
  <div class="container">
    <div class="row">
      <aside class="col-sm-3">
        <menu name="ADMIN" menu={ opts.menus } path={ opts.path } classes={ this.adminMenuClass } />
      </aside>
      <div class="col-sm-9">
        <div data-is={ this.view } opts={ this.state } />
      </div>
    </div>
  </div>
  <toast />

  <script>
    // add layout mixin
    this.mixin ('page');
    this.mixin ('config');
    this.mixin ('layout');

    // set menu class object
    this.menuClass = {
      'main' : 'navbar-nav'
    };
    this.adminMenuClass = {
      'main' : 'nav nav-pills flex-column',
      'item' : 'nav-item',
      'link' : 'nav-link'
    };

  </script>
</admin-layout>
